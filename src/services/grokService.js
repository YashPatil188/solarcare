import OpenAI from 'openai';

const API_KEY = import.meta.env.VITE_GROK_API_KEY;
const isValid = API_KEY && API_KEY !== 'YOUR_XAI_GROK_API_KEY';

const client = isValid ? new OpenAI({
    apiKey: API_KEY,
    baseURL: 'https://api.x.ai/v1',
    dangerouslyAllowBrowser: true,
}) : null;

const SOLAR_SYSTEM_PROMPT = `You are SolarCare AI — India's most knowledgeable solar energy support assistant with 15+ years expertise. You work for SolarCare, a solar maintenance and support company.

SOLAR KNOWLEDGE BASE:

PANELS: Monocrystalline (18-22% eff), Polycrystalline (15-17%), Thin-Film (10-13%), Bifacial. 1kW generates 4-5 units/day in India. Panels last 25-30 years, degrade 0.5-0.7%/year. Soiling causes 15-25% output loss. DIY safe: cleaning, visual check. NOT safe: wiring, junction boxes, mounting.

INVERTERS: On-Grid (needs grid), Off-Grid (battery only), Hybrid (both).
Error codes: E001=Grid fault (check MCB/supply), E002=Overvoltage (call tech), E003=Undervoltage (clean panels first), E004=Overtemp (improve ventilation), E005/E006=Ground/Isolation fault (SAFETY EMERGENCY - switch off now).
LED: Green=normal, Yellow=warning, Red slow=grid fault, Red fast=internal fault.
Brands: Sungrow, Growatt, Havells, Luminous, Microtek, Su-Kam, Delta, ABB.

BATTERIES: Lead-acid (3-5yr, needs water top-up q3months), VRLA/AGM (4-6yr, maintenance-free), Lithium LFP (10-15yr, best choice, 6000+ cycles). Fully charged voltage: Lead-acid=12.7V+, Lithium=13.3V+. White powder on terminals = sulfation (clean with baking soda+water).

PERFORMANCE: Output = kW × Peak Sun Hours × PR(0.75-0.85). Peak sun hours: Delhi=5.0, Mumbai=5.5, Bengaluru=5.7, Chennai=5.8, Hyderabad=5.6, Rajasthan=6.0. 5kW in Bengaluru = ~22.8 units/day.

INDIA SPECIFICS: PM Surya Ghar scheme: ₹30,000/kW (up to 3kW), ₹18,000/kW (3-10kW). Apply at pmsuryaghar.gov.in. Net metering available all states — sells excess to DISCOM. MNRE-empanelled installers only for subsidy. South-facing panels, 15-25° tilt optimal.

AMC PLANS: Basic Care ₹2,499/yr (2 cleanings, 1 health check), Gold Shield ₹4,999/yr (4 cleanings, 2 health checks, inverter inspection, priority support), Platinum Guard ₹12,999/3yr (monthly cleanings, quarterly checks, 4hr emergency response, 20% repair discount).

RESPONSE RULES:
1. Start with empathy/acknowledgment
2. Always state clearly: ✅ "You can fix this yourself" OR 🔧 "This needs a technician"
3. For DIY: Give exact numbered steps
4. For technician issues: Explain why and offer to create service ticket  
5. For emergencies: Safety steps FIRST, then ticket
6. Keep responses focused and under 300 words
7. Use emojis for readability

TICKET DETECTION: When customer describes an actionable problem, append this EXACTLY at message end:
|||TICKET_DATA|||
{"should_create_ticket":true,"category":"<panel_issue|inverter_issue|battery_issue|cleaning_maintenance|installation|amc|billing|urgent_safety>","priority":"<low|medium|high|emergency>","title":"<max 60 chars>","summary":"<1-2 sentences for technician>","diagnosis":"<AI diagnosis and recommended action>"}
|||END_TICKET_DATA|||

EMERGENCY triggers (priority=emergency, category=urgent_safety): fire, smoke, burning smell, electric shock, sparking, arcing, water in electrical components, exposed live wires.
For emergencies, give safety instructions FIRST before anything else.`;

// ─── Main Chat Function ────────────────────────────────────────
export async function sendChatMessage(conversationHistory, userMessage) {
    if (!client) return getOfflineResponse(userMessage);

    try {
        const messages = [
            { role: 'system', content: SOLAR_SYSTEM_PROMPT },
            ...conversationHistory
                .filter((_, i, arr) => !(i === 0 && arr[0].role === 'assistant'))
                .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: userMessage },
        ];

        const response = await client.chat.completions.create({
            model: 'grok-3-mini',
            messages,
            max_tokens: 1024,
            temperature: 0.7,
        });

        const text = response.choices[0].message.content;
        const ticketData = extractTicket(text);
        const clean = text.replace(/\|\|\|TICKET_DATA\|\|\|[\s\S]*?\|\|\|END_TICKET_DATA\|\|\|/g, '').trim();
        return { success: true, message: clean, ticketData };
    } catch (err) {
        console.error('Grok API error:', err);
        return getOfflineResponse(userMessage);
    }
}

// ─── Sentiment Analysis ────────────────────────────────────────
export async function analyzeSentiment(reviewText) {
    if (!client) return { sentiment: 'neutral', score: 0.5 };
    try {
        const r = await client.chat.completions.create({
            model: 'grok-3-mini',
            messages: [
                { role: 'system', content: 'You are a sentiment analyzer. Return ONLY valid JSON: {"sentiment":"positive|neutral|negative","score":0.0-1.0}' },
                { role: 'user', content: `Analyze this solar service review: "${reviewText}"` },
            ],
            max_tokens: 60,
            temperature: 0,
        });
        const json = r.choices[0].message.content.match(/\{[\s\S]*\}/);
        return json ? JSON.parse(json[0]) : { sentiment: 'neutral', score: 0.5 };
    } catch {
        return { sentiment: 'neutral', score: 0.5 };
    }
}

// ─── Complaint Extraction ──────────────────────────────────────
export async function extractComplaintDetails(description) {
    if (!client) return fallbackExtract(description);
    try {
        const r = await client.chat.completions.create({
            model: 'grok-3-mini',
            messages: [
                { role: 'system', content: 'You are a solar complaint analyzer. Return ONLY valid JSON with keys: category, priority, title, summary, diagnosis, estimated_resolution_hours.' },
                { role: 'user', content: `Analyze this solar complaint and categorize it. Category options: panel_issue, inverter_issue, battery_issue, cleaning_maintenance, installation, amc, billing, urgent_safety. Priority: low/medium/high/emergency.\n\nComplaint: "${description}"` },
            ],
            max_tokens: 300,
            temperature: 0,
        });
        const json = r.choices[0].message.content.match(/\{[\s\S]*\}/);
        return json ? JSON.parse(json[0]) : fallbackExtract(description);
    } catch {
        return fallbackExtract(description);
    }
}

// ─── Helper: Extract Ticket ────────────────────────────────────
function extractTicket(text) {
    const m = text.match(/\|\|\|TICKET_DATA\|\|\|([\s\S]*?)\|\|\|END_TICKET_DATA\|\|\|/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
}

// ─── Offline Knowledge Engine ──────────────────────────────────
function getOfflineResponse(msg) {
    const t = msg.toLowerCase();
    const has = (...w) => w.some(x => t.includes(x));

    if (has('fire','smoke','burning smell','electrocute','shock','spark','arcing','exposed wire'))
        return { success:true, message:`🚨 **EMERGENCY — Act Immediately!**\n\n1. Turn OFF the main AC breaker\n2. Turn OFF the solar inverter DC isolator\n3. Do NOT touch wet or damaged equipment\n4. Evacuate if fire/smoke present\n5. Call emergency: **1800-SOLAR-911**\n\nCreating emergency ticket now.`, ticketData:{should_create_ticket:true,category:'urgent_safety',priority:'emergency',title:'EMERGENCY: Safety Hazard',summary:'Customer reported emergency safety situation.',diagnosis:'Immediate on-site inspection required.'} };

    if (has('e001','grid fault','grid error'))
        return { success:true, message:`⚡ **E001 Grid Fault**\n\n✅ Check yourself first:\n1. Is main power supply working? (check other appliances)\n2. Check MCB in your DB box — may have tripped\n3. Inverter needs 180-260V grid voltage to operate\n4. Wait 5 minutes, then restart inverter\n\n🔧 Error persists? Grid relay may be faulty — I'll raise a service ticket.`, ticketData:{should_create_ticket:true,category:'inverter_issue',priority:'medium',title:'Inverter E001 Grid Fault',summary:'E001 grid fault on inverter.',diagnosis:'Grid voltage out of range or relay fault.'} };

    if (has('e005','e006','ground fault','earth fault','isolation fault'))
        return { success:true, message:`🚨 **Ground/Isolation Fault — Stop System Now**\n\n🔧 Needs technician immediately.\n\nThis means damaged wiring insulation — serious shock hazard.\n\n**Do now:**\n1. Turn OFF inverter\n2. Don't attempt DIY wiring repair\n3. Keep kids away from system\n\nRaising urgent ticket.`, ticketData:{should_create_ticket:true,category:'inverter_issue',priority:'high',title:'Ground/Isolation Fault E005/E006',summary:'Ground or isolation fault error detected.',diagnosis:'DC wiring insulation damage. Full inspection needed.'} };

    if (has('e004','overheat','too hot','inverter hot','overtemp'))
        return { success:true, message:`🌡️ **Inverter Overheating (E004)**\n\n✅ Try yourself:\n1. Ensure 30cm clearance on all sides\n2. Check ventilation — no sealed cabinet\n3. Clean ventilation grilles with dry brush\n4. Add shade cover if direct sun hits inverter\n5. Turn off 30 min, then restart\n\n🔧 Keeps overheating? Internal fan may be faulty.`, ticketData:null };

    if (has('beep','beeping','alarm','buzzing'))
        return { success:true, message:`🔔 **Inverter Beeping**\n\n- **Fast continuous beep** → Battery critically low\n- **Slow beep** → Grid interrupted\n- **3 beeps + pause** → Overload (turn off AC/geyser)\n- **Beep + red LED** → Internal fault — needs tech\n\n✅ For overload: reduce appliance load and restart.`, ticketData:null };

    if (has('red light','red led','yellow light','blinking','flashing'))
        return { success:true, message:`💡 **Inverter Warning Light**\n\n- 🟢 Green solid → Normal\n- 🟡 Yellow → Grid fluctuation/battery low\n- 🔴 Red slow blink → Grid fault\n- 🔴 Red fast blink → Internal fault\n- 🔴 Red solid → Critical shutdown\n\n✅ Yellow usually self-resolves.\n🔧 Fast/solid red → raise ticket.`, ticketData:{should_create_ticket:true,category:'inverter_issue',priority:'medium',title:'Inverter Fault Light',summary:'Warning/fault LED on inverter.',diagnosis:'On-site diagnosis required.'} };

    if (has('inverter not working','inverter dead','inverter off','not starting'))
        return { success:true, message:`⚡ **Inverter Not Starting**\n\n✅ Check first:\n1. DC isolator switch ON?\n2. AC isolator switch ON?\n3. Solar MCB in DB tripped?\n4. Sunlight on panels? (needs minimum light)\n5. What does display show?\n\n🔧 All switches ON, display blank → Inverter failure. Raising service ticket.`, ticketData:{should_create_ticket:true,category:'inverter_issue',priority:'high',title:'Inverter Not Starting',summary:'Inverter not powering on.',diagnosis:'Possible inverter failure or blown fuse.'} };

    if (has('cracked','broken panel','panel damage','hail'))
        return { success:true, message:`🔆 **Damaged Solar Panel**\n\n🔧 Needs technician — don't touch.\n\nCracked panels risk hot spots (fire) and shock hazard.\n\n**Do now:**\n1. Don't touch cracked panel\n2. Burn marks/discolouration → turn off system\n3. Photograph for warranty/insurance claim\n\nRaising high-priority ticket.`, ticketData:{should_create_ticket:true,category:'panel_issue',priority:'high',title:'Damaged Solar Panel',summary:'Cracked/damaged solar panel reported.',diagnosis:'Panel replacement and safety inspection required.'} };

    if (has('low output','less generation','low generation','output drop','less units','not generating'))
        return { success:true, message:`📉 **Low Solar Output — Diagnosis**\n\n✅ Check yourself:\n1. **Panels dirty?** Dust reduces output 15-25% — clean with soft wet cloth\n2. **New shading?** Trees/construction blocking panels?\n3. **Time of day?** Peak output 10am–3pm only\n4. **Weather?** Cloudy = 50-70% lower output — normal\n\n📊 Expected: 1kW→4-5 units/day, 3kW→12-15, 5kW→20-25\n\n🔧 Consistently low on sunny days after cleaning → raise ticket.`, ticketData:null };

    if (has('hot spot','hotspot','discolour','burn mark','brown spot'))
        return { success:true, message:`🌡️ **Hot Spot on Panel**\n\n🔧 Needs technician — fire risk.\n\nCauses: shading, faulty bypass diode, cracked cell.\nMay be covered under 10-12yr product warranty.\n\nRaising inspection ticket.`, ticketData:{should_create_ticket:true,category:'panel_issue',priority:'high',title:'Hot Spot on Solar Panel',summary:'Panel discolouration/hot spot reported.',diagnosis:'Bypass diode failure or cracked cell. Thermal inspection needed.'} };

    if (has('battery not charging','battery low','battery dead','backup not working','no backup'))
        return { success:true, message:`🔋 **Battery Not Charging**\n\n✅ Check:\n1. Charge controller showing charging status?\n2. Multimeter voltage: Lead-acid=12.7V+, Lithium=13.3V+\n3. Minimum 2-3hr good sunlight needed for charging\n4. Lead-acid: White powder on terminals? Clean with baking soda+water\n\n🔧 Voltage below 11V (lead-acid)/10V (lithium) → Battery damaged.`, ticketData:{should_create_ticket:true,category:'battery_issue',priority:'medium',title:'Battery Not Charging',summary:'Battery not reaching full charge.',diagnosis:'Possible deep discharge, sulfation, or BMS fault.'} };

    if (has('battery smell','rotten egg','sulfur','battery bulge','swollen'))
        return { success:true, message:`⚠️ **Battery Safety Issue**\n\n🔧 Immediate technician required.\n\nRotten egg smell = overcharging/cell failure.\nSwelling = thermal runaway risk (fire).\n\n**Now:** Turn off system, ventilate area, no charging.\n\nRaising urgent ticket.`, ticketData:{should_create_ticket:true,category:'battery_issue',priority:'high',title:'Battery Safety Issue',summary:'Gas smell/swelling from battery.',diagnosis:'Cell failure or thermal runaway. Immediate replacement needed.'} };

    if (has('distilled water','battery water','electrolyte','water level'))
        return { success:true, message:`🔋 **Battery Water Top-Up**\n\n✅ DIY safe:\n1. Only when **fully charged**\n2. Use **distilled water only** (not tap/RO)\n3. Fill until plates just covered\n4. Don't overfill\n5. Every 2-3 months\n\n⚠️ Work in ventilated area, wear gloves, no flames nearby.`, ticketData:null };

    if (has('clean','dirty','dust','bird','droppings','pigeon','soiling','wash panel'))
        return { success:true, message:`🧹 **Panel Cleaning**\n\n✅ DIY safe:\n1. Clean **early morning or evening** (hot panels risk)\n2. Soft microfibre cloth + plain water only\n3. No harsh chemicals or abrasives\n4. Soak bird droppings 2 min first\n\n**Frequency:** Urban=every 2-3 weeks, Coastal=monthly, Rural=every 4-6 weeks\n\n🔧 Want professional cleaning with inspection? I'll schedule it.`, ticketData:{should_create_ticket:true,category:'cleaning_maintenance',priority:'low',title:'Panel Cleaning Request',summary:'Customer requesting cleaning service.',diagnosis:'Routine cleaning maintenance.'} };

    if (has('subsidy','pm surya','government scheme','mnre','central financial'))
        return { success:true, message:`🏛️ **PM Surya Ghar Muft Bijli Yojana**\n\n| System Size | Subsidy |\n|---|---|\n| Up to 3kW | ₹30,000/kW |\n| 3-10kW | ₹18,000/kW |\n\n**3kW system = ₹90,000 subsidy!**\n\n**Apply:**\n1. Visit **pmsuryaghar.gov.in**\n2. Register with electricity consumer number\n3. Select MNRE vendor\n4. Subsidy credited to bank directly\n\n*State subsidies may apply additionally.*`, ticketData:null };

    if (has('net meter','net metering','sell power','discom','export','grid sell'))
        return { success:true, message:`⚡ **Net Metering**\n\nSell excess solar power back to grid!\n\n**How:** Excess units exported → credited against your bill\n**Result:** Bill can reach ₹0 or even credit\n\n**Get net metering:**\n1. Apply to your DISCOM\n2. They inspect installation\n3. Install bi-directional meter\n4. Takes 30-60 days\n\nAll Indian states have net metering policy.`, ticketData:null };

    if (has('amc','annual maintenance','maintenance plan','gold shield','platinum','basic care'))
        return { success:true, message:`📋 **SolarCare AMC Plans**\n\n🥉 **Basic Care** — ₹2,499/yr\n2 cleanings + 1 health check\n\n🥇 **Gold Shield** — ₹4,999/yr\n4 cleanings + 2 health checks + inverter inspection + priority support\n\n💎 **Platinum Guard** — ₹12,999/3yr\nMonthly cleanings + quarterly checks + 4hr emergency + 20% repair discount\n\n**Why AMC?** Regular care adds 3-5 years to system life and saves ₹10,000s in repairs.`, ticketData:null };

    if (has('wiring','loose connection','mc4','cable','junction box','wire'))
        return { success:true, message:`🔌 **Wiring Issue**\n\n🔧 Never DIY — DC wiring is live even at night.\n\nCommon issues: loose MC4 connectors, damaged UV insulation, rodent damage, corroded junction boxes.\n\nLoose connections cause arc faults and fire.\n\nRaising wiring inspection ticket.`, ticketData:{should_create_ticket:true,category:'panel_issue',priority:'high',title:'Wiring/Connection Issue',summary:'Wiring issue reported.',diagnosis:'Loose MC4 connectors or cable damage. Full safety inspection required.'} };

    if (has('rain','monsoon','water leaking','lightning','storm','thunder'))
        return { success:true, message:`🌧️ **Monsoon Care**\n\n✅ Panels are waterproof (IP65/IP67) — rain cleans them!\n\n**Check after storms:**\n1. Mounting brackets for rust\n2. Inverter area — must stay dry\n3. Junction box seals intact\n4. After lightning — check inverter surge protector (SPD)\n\n🔧 Water inside inverter/junction box → Turn off system immediately and raise ticket.\n\nExpect 30-50% lower generation on cloudy/rainy days — completely normal.`, ticketData:null };

    if (has('install','new installation','buy solar','get solar','set up'))
        return { success:true, message:`🏗️ **New Solar Installation**\n\n**Steps:**\n1. Site assessment (roof, shading, load)\n2. System design\n3. DISCOM approval (30-60 days for grid-tie)\n4. Installation (1-2 days)\n5. Net metering + subsidy application\n\n**Sizing:** 500 units/month → 4-5kW system\n**Cost:** ₹35,000–₹50,000/kW (before subsidy)\n**Payback:** 3-5 years\n\nSolarCare provides end-to-end service. Shall I arrange a free site assessment?`, ticketData:{should_create_ticket:true,category:'installation',priority:'low',title:'New Installation Enquiry',summary:'Customer requesting solar installation.',diagnosis:'Arrange site assessment and proposal.'} };

    if (has('bill','electricity bill','not reducing','high bill'))
        return { success:true, message:`💰 **Bill Not Reducing?**\n\n**Common reasons:**\n1. **Net metering not active** — check with DISCOM\n2. **Night consumption** — solar only works daytime\n3. **System underperforming** — check daily generation\n4. **Fixed DISCOM charges** — some charges remain regardless\n5. **More appliances** added recently?\n\n**Check:** Inverter total monthly generation vs bill imported units.\n\n🔧 Generation looks fine but bill unchanged? Raise billing review ticket.`, ticketData:{should_create_ticket:true,category:'billing',priority:'low',title:'Bill Not Reducing After Solar',summary:'Bill unchanged despite solar system.',diagnosis:'Investigate net metering activation and generation data.'} };

    if (has('how does solar','explain solar','what is solar','solar basics','how it work'))
        return { success:true, message:`☀️ **How Solar Power Works**\n\n1. ☀️ **Panels** convert sunlight → DC electricity\n2. ⚡ **Inverter** converts DC → AC (what your home uses)\n3. 🏠 **Home** uses solar first; excess goes to battery/grid\n4. 🔋 **Battery** stores energy for night/power cuts\n5. 🔌 **Net Meter** credits your exported units\n\n**System types:**\n- **On-Grid:** Grid-connected, best ROI, no backup\n- **Off-Grid:** Battery only, works during outages\n- **Hybrid:** Battery + grid, best of both\n\nWant to know about costs or sizing?`, ticketData:null };

    if (has('performance ratio','what is pr','efficiency ratio'))
        return { success:true, message:`📊 **Performance Ratio (PR)**\n\nPR measures how efficiently your system converts sunlight to electricity.\n\n**Good PR:** 75-85%\n**Formula:** PR = Actual Output ÷ (Panel kW × Peak Sun Hours)\n\n**Example:** 5kW system in Bengaluru on a good day:\n- Expected: 5 × 5.7 = 28.5 kWh\n- Actual: 23 kWh\n- PR = 23/28.5 = **80.7%** ✅\n\nBelow 70% consistently → investigate soiling, shading, or faults.`, ticketData:null };

    return {
        success: true,
        message: `👋 **Hello! I'm SolarCare AI** ☀️\n\nI'm your expert solar assistant powered by Grok AI, specializing in:\n\n- 🔴 Inverter errors & troubleshooting\n- 📉 Low output diagnosis\n- 🔋 Battery issues\n- 🧹 Cleaning & maintenance\n- 💰 PM Surya Ghar subsidy guidance\n- ⚡ Net metering help\n- 🏗️ New installation advice\n\n**Try asking:**\n- *"My inverter shows E001 error"*\n- *"Solar output dropped suddenly"*\n- *"How to apply for subsidy?"*\n- *"My battery is not charging"*\n\nDescribe your issue and I'll tell you exactly what to do! 🔧`,
        ticketData: null,
    };
}

// ─── Complaint Extraction Fallback ────────────────────────────
function fallbackExtract(description) {
    const t = description.toLowerCase();
    const has = (...w) => w.some(x => t.includes(x));
    let category = 'general', priority = 'medium';
    if (has('fire','smoke','shock','spark','arcing')) { category='urgent_safety'; priority='emergency'; }
    else if (has('inverter','error','red light','e001','e005','beep')) { category='inverter_issue'; priority='high'; }
    else if (has('panel','crack','hot spot','low output','low generation')) { category='panel_issue'; priority='high'; }
    else if (has('battery','backup','not charging','swollen','smell')) { category='battery_issue'; priority='medium'; }
    else if (has('clean','dust','bird','dirty')) { category='cleaning_maintenance'; priority='low'; }
    else if (has('install','new system','buy solar')) { category='installation'; priority='medium'; }
    else if (has('amc','contract','warranty')) { category='amc'; priority='low'; }
    else if (has('bill','invoice','not reducing')) { category='billing'; priority='low'; }
    else if (has('wire','cable','loose','junction')) { category='panel_issue'; priority='high'; }
    return { category, priority, title: description.slice(0,60), summary: description, diagnosis: 'Requires manual review', estimated_resolution_hours: priority==='emergency'?2:priority==='high'?12:24 };
}
