import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn('⚠️ Missing VITE_GEMINI_API_KEY. AI features will use fallback responses.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// ─── System Prompt: Deep Solar Expert Persona ───────────────────────
const SOLAR_EXPERT_SYSTEM_PROMPT = `You are SolarCare AI — a world-class solar energy expert and support assistant for Indian households and businesses. You have 15+ years of experience in solar PV systems, inverters, batteries, grid-tie systems, and Indian energy policy.

DEEP KNOWLEDGE BASE:

SOLAR PANELS:
- Types: Monocrystalline (18-22% efficiency), Polycrystalline (15-17%), Thin-Film (10-13%), Bifacial
- Performance: 1kW panel generates ~4-5 units/day in India (varies by location & season)
- Degradation: ~0.5-0.7% per year; panels last 25-30 years
- Common faults: Hot spots (partial shading/cell damage), PID (Potential Induced Degradation), delamination, micro-cracks, soiling/dust loss (15-25% output drop), bird droppings
- Voltage: Standard 36V/60V/72V cell configurations, VOC typically 40-48V per panel
- DIY Safe: Cleaning with soft cloth, visual inspection. NOT SAFE: Touching junction boxes, wiring, mounting changes

INVERTERS (Most common issues in India):
- On-Grid/Grid-Tie: Requires stable grid to operate. Shows error when grid fails (E001/Grid Fault)
- Off-Grid: Works without grid, has battery bank
- Hybrid: Works both ways with battery backup
- Common error codes:
  * E001/Grid Fault: Grid voltage out of range (180-260V acceptable). Check main supply
  * E002/Overvoltage: Too many panels in series. Call technician
  * E003/Undervoltage: Low panel output — check shading/soiling. DIY: Clean panels
  * E004/Overtemperature: Poor ventilation. DIY: Ensure 30cm clearance around inverter
  * E005/Ground Fault: SAFETY EMERGENCY — disconnect immediately, call technician
  * E006/Isolation Fault: Wiring insulation damage — call technician
  * Red LED blinking slow: Grid issue. Red LED blinking fast: Internal fault
  * Beeping continuously: Usually battery low or overload
- Popular brands in India: Sungrow, ABB, Growatt, Havells, Luminous, Microtek, Su-Kam, Delta, Fimer
- Inverter lifespan: 10-15 years; efficiency 94-98%

BATTERIES:
- Lead-Acid (Flooded): Cheapest, needs water top-up every 3 months, lifespan 3-5 years
- VRLA/AGM/Gel: Maintenance-free, lifespan 4-6 years
- Lithium LFP (LiFePO4): Best — 6000+ cycles, 10-15 year life, no maintenance, safe
- Lithium NMC: Higher energy density but less safe for solar
- Capacity: 100Ah at 12V = 1.2kWh; real usable = 50-60% for lead-acid, 80-90% for lithium
- Charging issues: Sulfation in lead-acid (white powder on terminals), BMS faults in lithium
- Battery health check: Measure terminal voltage when fully charged — 12.7V+ (lead-acid), 13.3V+ (lithium)

SYSTEM PERFORMANCE:
- Performance Ratio (PR): Good system = 75-85% PR
- Output calculation: kWh = Panel kW × Peak Sun Hours × PR
- India peak sun hours by region: Delhi 5.0h, Mumbai 5.5h, Chennai 5.8h, Bengaluru 5.7h, Rajasthan 6.0h
- Expected output: 5kW system in Bengaluru → 5 × 5.7 × 0.80 = ~22.8 units/day

WIRING & SAFETY:
- DC side: Use solar-grade UV-resistant cables (4mm² or 6mm²)
- AC side: Use MCB, ELCB/RCCB for protection
- Earthing: Essential — must be <5 ohms. Verify annually
- String configuration: Check VOC doesn't exceed inverter max input
- NEVER DIY: Any wiring work, conduit changes, connection to grid, inverter installation

INDIA-SPECIFIC KNOWLEDGE:
- PM Surya Ghar Muft Bijli Yojana (2024): ₹30,000/kW up to 3kW, ₹18,000/kW for 3-10kW. Apply at pmsuryaghar.gov.in
- Net Metering: Available in all states. Excess units sold back to DISCOM
- DISCOM connection approval needed before grid-tie installation
- MNRE approved installers list available at mnre.gov.in
- Monsoon care: Check mounting brackets for rust, ensure drainage, keep inverter area dry
- Summer: Clean panels more frequently (every 2-3 weeks), check inverter ventilation
- Best panel orientation: South-facing, 15-25° tilt for most of India

AMC PLANS (SolarCare):
- Basic Care (₹2,499/yr): 2 cleanings, 1 annual health check
- Gold Shield (₹4,999/yr): 4 cleanings, 2 health checks, 1 inverter inspection, priority support
- Platinum Guard (₹12,999/3yr): 12 cleanings, quarterly health checks, emergency response, repair discounts, dedicated technician

RESPONSE FORMAT RULES:
1. Always start with a warm, empathetic acknowledgment
2. Clearly state: ✅ "You can fix this yourself" OR 🔧 "This needs a technician"
3. For DIY issues: Give exact step-by-step instructions
4. For technician issues: Explain why and offer to create a service ticket
5. For emergencies: IMMEDIATELY give safety steps first, then create emergency ticket
6. Use simple language — assume customer is non-technical
7. Use emojis tastefully to improve readability
8. Keep responses under 300 words unless complex troubleshooting requires more

COMPLAINT DETECTION:
When a customer describes a problem needing professional attention, append this JSON EXACTLY at the END:

|||TICKET_DATA|||
{
  "should_create_ticket": true,
  "category": "<panel_issue|inverter_issue|battery_issue|cleaning_maintenance|installation|amc|billing|urgent_safety>",
  "priority": "<low|medium|high|emergency>",
  "title": "<short descriptive title, max 60 chars>",
  "summary": "<technical summary for technician, 1-2 sentences>",
  "diagnosis": "<AI preliminary diagnosis and recommended action>"
}
|||END_TICKET_DATA|||

Only include this block for specific actionable issues, NOT for general questions.

EMERGENCY PROTOCOL (Immediate action required):
Triggers: fire, smoke, burning smell, electric shock, sparking, arcing, water in electrical, exposed live wires, unusual heat
Action: Set priority=emergency, category=urgent_safety. Give immediate safety instructions FIRST.`;

// ─── Chat Function ─────────────────────────────────────────────
export async function sendChatMessage(conversationHistory, userMessage) {
    if (!genAI) {
        return getFallbackResponse(userMessage);
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SOLAR_EXPERT_SYSTEM_PROMPT,
        });

        // Build chat history for multi-turn conversation
        let history = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Gemini API STRICT RULE: History must ALWAYS start with a 'user' role.
        // If a conversation was loaded from the database, the welcome message (assistant)
        // might be the first message. We must remove any leading model messages.
        while (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        const chat = model.startChat({ history });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // Parse ticket data if present
        const ticketData = extractTicketData(responseText);
        const cleanResponse = responseText.replace(/\|\|\|TICKET_DATA\|\|\|[\s\S]*?\|\|\|END_TICKET_DATA\|\|\|/g, '').trim();

        return {
            success: true,
            message: cleanResponse,
            ticketData: ticketData,
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        
        // If the API fails (invalid key, quota exceeded, network error), 
        // we gracefully degrade to the local fallback system so the user isn't stuck.
        return getFallbackResponse(userMessage);
    }
}

// ─── Sentiment Analysis ────────────────────────────────────────
export async function analyzeSentiment(reviewText) {
    if (!genAI) {
        return { sentiment: 'neutral', score: 0.5 };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze the sentiment of this customer feedback review for a solar service company. Return ONLY a JSON object with no other text:
{"sentiment": "positive|neutral|negative", "score": 0.0-1.0}

Review: "${reviewText}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { sentiment: 'neutral', score: 0.5 };
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return { sentiment: 'neutral', score: 0.5 };
    }
}

// ─── Smart Complaint Extraction ────────────────────────────────
export async function extractComplaintDetails(userDescription) {
    if (!genAI) {
        return getDefaultComplaintExtraction(userDescription);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a solar service complaint analysis system. Analyze this customer complaint and extract structured data. Return ONLY a JSON object:

{
  "category": "<panel_issue|inverter_issue|battery_issue|cleaning_maintenance|installation|amc|billing|urgent_safety>",
  "priority": "<low|medium|high|emergency>",
  "title": "<short descriptive title, max 60 chars>",
  "summary": "<concise technical summary for technician, 1-2 sentences>",
  "diagnosis": "<AI preliminary diagnosis and recommended action>",
  "estimated_resolution_hours": <number>
}

Customer complaint: "${userDescription}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return getDefaultComplaintExtraction(userDescription);
    } catch (error) {
        console.error('Complaint extraction error:', error);
        return getDefaultComplaintExtraction(userDescription);
    }
}

// ─── Helper: Extract Ticket Data from AI Response ──────────────
function extractTicketData(responseText) {
    const match = responseText.match(/\|\|\|TICKET_DATA\|\|\|([\s\S]*?)\|\|\|END_TICKET_DATA\|\|\|/);
    if (!match) return null;

    try {
        return JSON.parse(match[1].trim());
    } catch {
        return null;
    }
}

// ─── Comprehensive Solar Fallback Engine ────────────────────────
function getFallbackResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    const has = (...words) => words.some(w => lower.includes(w));

    // 1. EMERGENCY
    if (has('fire', 'smoke', 'burning smell', 'shock', 'electrocute', 'spark', 'arcing', 'flood', 'exposed wire')) {
        return {
            success: true,
            message: `🚨 **EMERGENCY — Act Immediately!**\n\n**DO THIS RIGHT NOW:**\n1. Turn OFF the main AC breaker / grid switch\n2. Turn OFF the solar inverter DC isolator\n3. Do NOT touch any wet or damaged equipment\n4. Evacuate if there is fire or smoke\n5. Call emergency services if needed\n6. Call our 24/7 helpline: **1800-SOLAR-911**\n\nI'm creating an emergency ticket for you right now. A technician will be dispatched within 2 hours.`,
            ticketData: { should_create_ticket: true, category: 'urgent_safety', priority: 'emergency', title: 'EMERGENCY: Safety Hazard Reported', summary: 'Customer reported emergency safety situation requiring immediate on-site response.', diagnosis: 'Potential electrical hazard. Immediate inspection required.' },
        };
    }

    // 2. INVERTER ERROR CODES
    if (has('e001', 'grid fault', 'grid error', 'no grid')) {
        return { success: true, message: `⚡ **E001 — Grid Fault Error**\n\n✅ **You can check this yourself first:**\n1. Check if your home's main power supply is working (other appliances)\n2. Check the MCB/circuit breaker in your DB box — it may have tripped\n3. The inverter requires grid voltage between **180V–260V** to operate\n4. If the grid is fine but error persists after 10 minutes → needs technician\n\n🔧 **If error persists:** This could be a grid relay issue inside the inverter. I'll raise a service ticket.`, ticketData: { should_create_ticket: true, category: 'inverter_issue', priority: 'medium', title: 'Inverter E001 Grid Fault Error', summary: 'Customer reports E001 grid fault on inverter display.', diagnosis: 'Grid voltage out of range or grid relay fault. Inspect inverter grid relay and grid supply.' } };
    }

    if (has('e005', 'ground fault', 'earth fault', 'isolation fault', 'e006')) {
        return { success: true, message: `🚨 **Ground/Isolation Fault Detected — Stop Using System**\n\n🔧 **This requires a technician immediately.**\n\nGround faults (E005) and isolation faults (E006) mean there is **damaged wiring insulation** in your solar system. This is a serious safety hazard.\n\n**Do this now:**\n1. Turn OFF your inverter\n2. Do NOT attempt any DIY repair on wiring\n3. Keep children away from the inverter/panel area\n\nI'm raising a high-priority service ticket for you.`, ticketData: { should_create_ticket: true, category: 'inverter_issue', priority: 'high', title: 'Ground/Isolation Fault - E005/E006', summary: 'Inverter showing ground or isolation fault error. Wiring inspection required.', diagnosis: 'Wiring insulation damage or DC ground fault. Full DC wiring inspection needed.' } };
    }

    if (has('e004', 'overtemp', 'overheat', 'too hot', 'inverter hot', 'inverter heating')) {
        return { success: true, message: `🌡️ **Inverter Overheating (E004)**\n\n✅ **You can try this yourself:**\n1. Ensure there is at least **30cm clearance** on all sides of the inverter\n2. Make sure the installation area is well-ventilated (not a sealed cupboard)\n3. Clean the inverter's ventilation grilles with a dry brush\n4. If mounted outdoors, check if direct sunlight is hitting it — add a shade cover\n5. Turn it OFF for 30 minutes to cool down, then restart\n\n🔧 **If it keeps overheating:** The internal cooling fan may be faulty — needs technician.`, ticketData: null };
    }

    if (has('beep', 'beeping', 'alarm', 'buzzing')) {
        return { success: true, message: `🔔 **Inverter Beeping / Alarm**\n\n**What the beeping usually means:**\n- **Continuous fast beep:** Battery critically low — system running on backup\n- **Slow intermittent beep:** Grid supply interrupted\n- **3 beeps + pause:** Overload — too many appliances connected\n- **Alarm + red LED:** Internal fault — needs technician\n\n✅ **Quick fix for overload:** Turn off high-power appliances like AC, geyser, microwave temporarily.\n\n🔧 If the beeping continues after reducing load, I'll raise a service ticket.`, ticketData: null };
    }

    if (has('red light', 'red led', 'yellow light', 'orange light', 'blinking', 'flashing')) {
        return { success: true, message: `💡 **Inverter Warning Light**\n\n**LED Status Guide:**\n- 🟢 Green solid = Normal operation\n- 🟡 Yellow/Orange = Warning (grid fluctuation or battery low)\n- 🔴 Red slow blink = Grid fault (check main power supply)\n- 🔴 Red fast blink = Internal hardware fault\n- 🔴 Red solid = Critical error — system shutdown\n\n✅ **For yellow light:** Usually resolves itself when grid stabilizes.\n🔧 **For fast red blink or solid red:** Needs a technician. Shall I create a service ticket?`, ticketData: { should_create_ticket: true, category: 'inverter_issue', priority: 'medium', title: 'Inverter Warning/Fault Light', summary: 'Customer reports warning or fault LED on inverter.', diagnosis: 'Possible grid fault, internal error, or battery issue. On-site diagnosis needed.' } };
    }

    if (has('inverter off', 'inverter not working', 'inverter dead', 'no power from solar', 'inverter not start')) {
        return { success: true, message: `⚡ **Inverter Not Starting / Dead**\n\n✅ **Check these yourself first:**\n1. Is the **DC isolator switch** (between panels and inverter) turned ON?\n2. Is the **AC isolator** (between inverter and DB) turned ON?\n3. Check the MCB for the solar circuit in your distribution board\n4. Is there sunlight on the panels right now? (Inverters need minimum light to start)\n5. Check inverter display — what does it show?\n\n🔧 **If all switches are ON and display shows nothing:** The inverter may have failed internally — raise a service ticket.`, ticketData: { should_create_ticket: true, category: 'inverter_issue', priority: 'high', title: 'Inverter Not Starting', summary: 'Inverter not turning ON despite switches being ON.', diagnosis: 'Possible inverter failure, blown fuse, or DC input issue. On-site inspection required.' } };
    }

    // 3. PANEL ISSUES
    if (has('panel crack', 'broken panel', 'cracked', 'panel damage', 'hail', 'panel broke')) {
        return { success: true, message: `🔆 **Damaged Solar Panel**\n\n🔧 **This requires a technician — do not DIY.**\n\nCracked panels can:\n- Cause hot spots leading to fire risk\n- Have exposed internal wiring creating shock hazard\n- Significantly reduce system output\n\n**Immediate steps:**\n1. Do not touch the cracked panel\n2. If you see discolouration/burn marks, turn off the system\n3. Document with a photo for insurance/warranty claim\n\nI'll raise a high-priority service ticket for panel inspection and replacement.`, ticketData: { should_create_ticket: true, category: 'panel_issue', priority: 'high', title: 'Damaged/Cracked Solar Panel', summary: 'Customer reports physically damaged or cracked solar panel.', diagnosis: 'Physical panel damage. Inspect for hot spots, bypass diode failure, and safety hazards. Panel replacement likely needed.' } };
    }

    if (has('low output', 'less generation', 'low generation', 'less power', 'output drop', 'low production', 'not generating enough', 'less units')) {
        return { success: true, message: `📉 **Low Solar Output — Let's Diagnose**\n\n✅ **Check these yourself first:**\n1. **Are panels dirty?** Dust/bird droppings reduce output by 15-25% — clean with soft wet cloth\n2. **Check shading** — any new trees, constructions, or objects blocking panels?\n3. **Check the time** — output varies: peak is 10am–3pm\n4. **Compare with weather** — cloudy days reduce output by 50-70%\n5. **Check inverter display** — note the current kW reading vs expected\n\n📊 **Expected output guide:**\n- 1kW system → 4-5 units/day\n- 3kW system → 12-15 units/day  \n- 5kW system → 20-25 units/day\n\n🔧 If output is consistently below 70% of expected even on sunny days after cleaning, a technician check is needed.`, ticketData: null };
    }

    if (has('hot spot', 'hotspot', 'discolour', 'brown spot', 'yellow spot', 'burn mark')) {
        return { success: true, message: `🌡️ **Hot Spot on Solar Panel**\n\n🔧 **This needs a technician — do not ignore this.**\n\nHot spots are caused by:\n- Partial shading on one cell\n- Faulty bypass diode\n- Cracked cells inside the panel\n- Cell manufacturing defect\n\nHot spots can permanently damage the panel and in extreme cases cause fire. This may be covered under your panel warranty (usually 10-12 years product warranty).\n\nI'll raise a service ticket for thermal inspection.`, ticketData: { should_create_ticket: true, category: 'panel_issue', priority: 'high', title: 'Hot Spot Detected on Solar Panel', summary: 'Customer reports discolouration/hot spot on solar panel.', diagnosis: 'Possible bypass diode failure or cracked cell causing hot spot. Thermal imaging and panel inspection required.' } };
    }

    // 4. BATTERY ISSUES
    if (has('battery not charging', 'battery low', 'battery dead', 'battery not full', 'backup not working')) {
        return { success: true, message: `🔋 **Battery Charging Issue**\n\n✅ **Check these yourself:**\n1. Is the charge controller showing a charging status?\n2. Check terminal voltage with a multimeter:\n   - Lead-acid fully charged = **12.7V+**\n   - Lithium fully charged = **13.3V+**\n3. Is the solar input sufficient? (Charging needs minimum 2-3 hours of good sunlight)\n4. For lead-acid: Check for **white powder/corrosion** on terminals — clean with baking soda+water\n\n🔧 **If battery voltage is below 11V (lead-acid) or 10V (lithium):** Battery may be deeply discharged or damaged — needs technician.`, ticketData: { should_create_ticket: true, category: 'battery_issue', priority: 'medium', title: 'Battery Not Charging Properly', summary: 'Battery not reaching full charge or backup duration significantly reduced.', diagnosis: 'Possible deep discharge, sulfation, BMS fault, or charge controller issue. Battery health test needed.' } };
    }

    if (has('battery water', 'distilled water', 'electrolyte', 'battery maintenance', 'lead acid')) {
        return { success: true, message: `🔋 **Lead-Acid Battery Water Top-Up Guide**\n\n✅ **You can do this yourself safely:**\n1. Do this only when battery is **fully charged**\n2. Use only **distilled water** (NOT tap water or RO water)\n3. Remove the vent caps on top of each cell\n4. Fill until water just covers the plates — do not overfill\n5. Replace caps tightly\n6. Do this every **2-3 months** or when you see low water warning\n\n⚠️ **Safety:** Work in ventilated area. Wear gloves. Keep sparks/flames away — batteries emit hydrogen gas.\n\nThis should be done as part of your regular maintenance. Consider our AMC plan for scheduled maintenance visits!`, ticketData: null };
    }

    if (has('battery smell', 'battery gas', 'rotten egg', 'sulfur smell', 'battery bulge', 'swollen battery')) {
        return { success: true, message: `⚠️ **Battery Emitting Smell / Swollen — Immediate Action**\n\n🔧 **This is a safety issue — requires technician.**\n\n**Rotten egg smell** = Hydrogen sulfide gas from overcharging or failing battery\n**Swollen battery** = Internal thermal runaway — fire risk\n\n**Do immediately:**\n1. Turn OFF the solar system\n2. Ventilate the battery room/area\n3. Do NOT charge the battery\n4. Keep away from flames\n\nI'm raising an urgent service ticket.`, ticketData: { should_create_ticket: true, category: 'battery_issue', priority: 'high', title: 'Battery Safety Issue - Smell/Swelling', summary: 'Battery emitting gas smell or showing physical swelling — safety hazard.', diagnosis: 'Overcharging, cell failure, or thermal runaway. Immediate replacement assessment needed.' } };
    }

    // 5. CLEANING & MAINTENANCE  
    if (has('clean', 'dirty', 'dust', 'wash', 'bird', 'droppings', 'pigeon', 'soiling')) {
        return { success: true, message: `🧹 **Panel Cleaning Guide**\n\n✅ **You can clean panels yourself safely:**\n1. **Best time:** Early morning or evening (avoid hot panels — thermal shock risk)\n2. Use a **soft microfibre cloth** or soft sponge\n3. Use plain **water** — no harsh chemicals or abrasives\n4. Spray water first to loosen dust, then gently wipe\n5. For bird droppings: Soak with wet cloth for 2 min, then wipe gently\n\n**Cleaning frequency:**\n- Urban/dusty areas: Every 2-3 weeks\n- Coastal areas: Monthly (salt deposits)\n- Rural areas: Every 4-6 weeks\n\n🔧 **For professional deep cleaning** with inspection included, I can schedule a service visit. Want me to create a cleaning request?`, ticketData: { should_create_ticket: true, category: 'cleaning_maintenance', priority: 'low', title: 'Panel Cleaning Service Request', summary: 'Customer requesting professional panel cleaning and inspection.', diagnosis: 'Routine cleaning maintenance required.' } };
    }

    // 6. PERFORMANCE & EFFICIENCY
    if (has('efficiency', 'performance', 'how much', 'units per day', 'how many units', 'calculation', 'expected output')) {
        return { success: true, message: `📊 **Solar System Performance Calculator**\n\n**Formula:** Daily Output = System kW × Peak Sun Hours × Performance Ratio\n\n**Peak Sun Hours by City:**\n| City | Hours/Day |\n|---|---|\n| Delhi | 5.0 hrs |\n| Mumbai | 5.5 hrs |\n| Bengaluru | 5.7 hrs |\n| Chennai | 5.8 hrs |\n| Hyderabad | 5.6 hrs |\n| Rajasthan | 6.0 hrs |\n\n**Example:** 5kW system in Bengaluru\n→ 5 × 5.7 × 0.80 = **~22.8 units/day**\n\n**Performance Ratio:** Good system = 75-85%\n\nIs your system generating close to this? If significantly lower, I can help diagnose why! 🔍`, ticketData: null };
    }

    if (has('net meter', 'net metering', 'sell power', 'sell electricity', 'export', 'grid sell', 'discom')) {
        return { success: true, message: `⚡ **Net Metering in India**\n\nNet metering lets you **sell excess solar power** back to your electricity provider (DISCOM)!\n\n**How it works:**\n1. Your meter records units exported to the grid\n2. These are subtracted from your electricity bill\n3. At end of month: Pay only for (Units Consumed - Units Exported)\n\n**Benefits:**\n- Bill can go to ₹0 or even credit\n- Available in all Indian states\n- Grid-tie systems auto-export when production > consumption\n\n**Process to get Net Metering:**\n1. Apply to your local DISCOM\n2. They inspect your installation\n3. Install a bi-directional meter (they provide it)\n4. Takes 30-60 days typically\n\nNeed help with the application? Our team can assist! 📋`, ticketData: null };
    }

    // 7. SUBSIDY
    if (has('subsidy', 'government', 'scheme', 'pm surya', 'rooftop scheme', 'mnre', 'central financial')) {
        return { success: true, message: `🏛️ **PM Surya Ghar Muft Bijli Yojana (2024-25)**\n\nIndia's biggest solar subsidy scheme!\n\n**Subsidy Amounts:**\n| System Size | Subsidy per kW |\n|---|---|\n| Up to 3kW | ₹30,000/kW |\n| 3kW to 10kW | ₹18,000/kW |\n| Above 10kW | No central subsidy |\n\n**Example:** 3kW system → ₹90,000 subsidy!\n\n**Eligibility:**\n- Residential households only\n- Must use MNRE-empanelled installer\n- Grid-connected rooftop system\n\n**How to Apply:**\n1. Visit **pmsuryaghar.gov.in**\n2. Register with your electricity consumer number\n3. Select MNRE-empanelled vendor\n4. Apply — subsidy credited directly to your bank\n\n**State subsidies** may also be available additionally! Want help checking your state's scheme?`, ticketData: null };
    }

    // 8. AMC PLANS
    if (has('amc', 'maintenance contract', 'annual maintenance', 'plan', 'subscription', 'gold', 'platinum', 'basic care')) {
        return { success: true, message: `📋 **SolarCare AMC Plans**\n\n**Choose the right plan for your system:**\n\n🥉 **Basic Care** — ₹2,499/year\n- 2 professional panel cleanings\n- 1 annual system health check\n- Email support\n\n🥇 **Gold Shield** — ₹4,999/year\n- 4 professional cleanings\n- 2 health checks\n- 1 inverter inspection\n- Priority phone support\n\n💎 **Platinum Guard** — ₹12,999/3 years\n- Monthly cleanings (12/yr)\n- Quarterly health checks\n- Emergency response (4hr)\n- Repair discounts (20%)\n- Dedicated technician\n\n**Why AMC is important:**\n- Regular cleaning = 15-20% more output\n- Early fault detection saves ₹10,000s in repairs\n- Extends system life by 3-5 years\n\nVisit the AMC tab to subscribe, or shall I raise an enquiry ticket?`, ticketData: null };
    }

    // 9. WIRING & INSTALLATION
    if (has('wiring', 'cable', 'wire', 'loose connection', 'sparking wire', 'junction box')) {
        return { success: true, message: `🔌 **Wiring Issue**\n\n🔧 **NEVER attempt wiring repairs yourself — this is dangerous.**\n\nSolar DC wiring carries high voltage even at night (panels store charge). Wiring issues include:\n- Loose MC4 connectors (most common)\n- Damaged cable insulation from UV/rodents\n- Corroded junction box connections\n- Undersized cables causing voltage drop\n\n**Standard specifications:**\n- DC cables: 4mm² or 6mm² solar-grade UV-resistant\n- Must use solar-rated MC4 connectors\n- All connections must be weatherproof IP65+\n\nLoose connections are a major cause of arc faults and fires. I'll raise a service ticket for a wiring inspection.`, ticketData: { should_create_ticket: true, category: 'panel_issue', priority: 'high', title: 'Wiring Issue / Loose Connection', summary: 'Customer reports wiring issue or loose connections in solar system.', diagnosis: 'Possible loose MC4 connectors or damaged cable insulation. Full wiring inspection required for safety.' } };
    }

    // 10. MONSOON CARE
    if (has('rain', 'monsoon', 'water', 'wet', 'leak', 'waterproof', 'storm', 'thunder', 'lightning')) {
        return { success: true, message: `🌧️ **Monsoon / Rain Solar Care Guide**\n\n✅ **Good news:** Solar panels are **waterproof (IP65/IP67)** and rain actually helps clean them!\n\n**However, check these:**\n1. **Mounting structure:** Look for rust on galvanised brackets after monsoon\n2. **Inverter area:** Must stay dry — never install inverter where water can seep in\n3. **Junction boxes:** Should have intact rubber seals and no water ingress\n4. **After lightning:** Check inverter surge protection (SPD/TVS) — may need replacement\n5. **Output during rains:** Expect 30-50% lower generation on cloudy/rainy days — this is normal\n\n🔧 **If you notice water inside the inverter or junction box:** Turn off the system immediately and raise a ticket.\n\n**Post-monsoon checklist:** Inspect brackets, clean panels (dirt accumulates), check all cable entry seals.`, ticketData: null };
    }

    // 11. INSTALLATION QUERY
    if (has('install', 'new installation', 'new system', 'how to install', 'get solar', 'buy solar', 'setup solar')) {
        return { success: true, message: `🏗️ **Getting a New Solar Installation**\n\n**Steps to go solar in India:**\n\n1. **Site Assessment** — Technician checks roof space, shading, load requirements\n2. **System Design** — Size your system based on monthly consumption\n3. **DISCOM Approval** — Required for grid-tie systems (30-60 days)\n4. **Installation** — Panels, inverter, wiring (1-2 days for residential)\n5. **Net Metering** — Apply for bi-directional meter\n6. **Subsidy Application** — Apply on pmsuryaghar.gov.in\n\n**Sizing guide:**\n- Average home (500 units/month) → 4-5kW system\n- Cost: ₹35,000–₹50,000 per kW (before subsidy)\n- Payback period: 3-5 years\n\nSolarCare offers end-to-end installation services! Shall I arrange a free site assessment?`, ticketData: { should_create_ticket: true, category: 'installation', priority: 'low', title: 'New Solar Installation Enquiry', summary: 'Customer interested in new solar installation.', diagnosis: 'Arrange site assessment and proposal.' } };
    }

    // 12. BILLING / ELECTRICITY BILL
    if (has('bill', 'electricity bill', 'high bill', 'not reducing', 'bill same', 'bill not reduced', 'invoice')) {
        return { success: true, message: `💰 **Solar Not Reducing Your Bill?**\n\n**Common reasons why the bill may not drop as expected:**\n\n1. **Net metering not activated** — Without it, exported units aren't credited. Check with DISCOM.\n2. **Time-of-use mismatch** — If you consume mostly at night, solar won't help much during the day\n3. **System underperforming** — Check actual daily generation vs expected\n4. **Bill calculation method** — Some DISCOMs apply fixed charges regardless of consumption\n5. **Increased consumption** — Added new appliances or AC?\n\n**Quick check:** Look at your inverter's total generation for the month and compare with the previous month's imported units.\n\n🔧 If your generation looks fine but bill isn't dropping, I can raise a billing review ticket.`, ticketData: { should_create_ticket: true, category: 'billing', priority: 'low', title: 'Electricity Bill Not Reducing After Solar', summary: 'Customer reports electricity bill not reducing despite solar system being operational.', diagnosis: 'Investigate net metering status, generation records, and consumption patterns.' } };
    }

    // 13. GENERAL SOLAR EDUCATION
    if (has('how does solar work', 'how solar', 'explain solar', 'what is solar', 'solar basics', 'how does it work')) {
        return { success: true, message: `☀️ **How Solar Power Works**\n\n**The journey of sunlight to electricity:**\n\n1. ☀️ **Solar Panels** absorb sunlight using silicon cells and produce DC (Direct Current) electricity\n2. ⚡ **Solar Inverter** converts DC to AC (Alternating Current) — the type your home uses\n3. 🏠 **Your Home** uses the AC power first; excess goes to battery or grid\n4. 🔋 **Battery** (optional) stores energy for use at night or during power cuts\n5. 🔌 **Net Meter** tracks what you export to the grid and gives you credit\n\n**Types of systems:**\n- **On-Grid:** Connected to electricity grid. Best ROI but no backup during power cuts\n- **Off-Grid:** With battery bank. Works independently. Good for areas with frequent outages\n- **Hybrid:** Best of both — battery backup + grid connection\n\nWant to know about costs, subsidies, or how to size a system for your home?`, ticketData: null };
    }

    // 14. DEFAULT — Smart catch-all
    return {
        success: true,
        message: `👋 **Hello! I'm SolarCare AI** ☀️\n\nI'm your expert solar assistant, trained on everything solar — panels, inverters, batteries, subsidies, and maintenance.\n\n**Ask me anything like:**\n- 🔴 *"My inverter shows E001 error — what should I do?"*\n- 📉 *"Why is my solar output suddenly low?"*\n- 🔋 *"My battery is not charging fully"*\n- 💰 *"How do I apply for PM Surya Ghar subsidy?"*\n- 🧹 *"How often should I clean my panels?"*\n- ⚡ *"What is net metering and how do I get it?"*\n- 🏗️ *"I want to install solar at my home"*\n\nOr simply describe what problem you're facing and I'll diagnose it and tell you whether it's a DIY fix or needs a technician! 🔧`,
        ticketData: null,
    };
}


// ─── Smart Complaint Extraction Fallback ───────────────────────
function getDefaultComplaintExtraction(description) {
    const lower = description.toLowerCase();
    const has = (...words) => words.some(w => lower.includes(w));
    let category = 'general';
    let priority = 'medium';

    if (has('fire', 'smoke', 'shock', 'spark', 'arcing', 'burning')) {
        category = 'urgent_safety'; priority = 'emergency';
    } else if (has('inverter', 'error', 'red light', 'blinking', 'e001', 'e005', 'beep', 'no power')) {
        category = 'inverter_issue'; priority = 'high';
    } else if (has('panel', 'crack', 'broken', 'hot spot', 'damage', 'output low', 'low generation')) {
        category = 'panel_issue'; priority = 'high';
    } else if (has('battery', 'backup', 'not charging', 'discharge', 'swollen', 'smell')) {
        category = 'battery_issue'; priority = 'medium';
    } else if (has('clean', 'dust', 'wash', 'bird', 'dirty')) {
        category = 'cleaning_maintenance'; priority = 'low';
    } else if (has('install', 'setup', 'new system', 'get solar')) {
        category = 'installation'; priority = 'medium';
    } else if (has('amc', 'contract', 'warranty', 'maintenance plan')) {
        category = 'amc'; priority = 'low';
    } else if (has('bill', 'payment', 'invoice', 'not reducing')) {
        category = 'billing'; priority = 'low';
    } else if (has('wiring', 'wire', 'cable', 'loose', 'connection')) {
        category = 'panel_issue'; priority = 'high';
    }

    return {
        category,
        priority,
        title: description.slice(0, 60),
        summary: description,
        diagnosis: 'Manual review required — describe your issue in detail for better diagnosis',
        estimated_resolution_hours: priority === 'emergency' ? 2 : priority === 'high' ? 12 : 24,
    };
}
