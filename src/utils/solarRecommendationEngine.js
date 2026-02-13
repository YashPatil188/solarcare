export const solarRecommendationEngine = {
    /**
     * Analyzes solar system data and recommends the best AMC plan.
     * 
     * @param {Object} system - The solar system object { capacity_kw, installation_date, ... }
     * @param {Array} availablePlans - List of plan objects from DB
     * @returns {Object} { recommendedPlanId, logic, tailoredMessage }
     */
    recommend: (system, availablePlans) => {
        if (!system || !availablePlans || availablePlans.length === 0) return null;

        const capacity = parseFloat(system.capacity_kw) || 0;

        // Calculate Age
        const installDate = new Date(system.installation_date || new Date());
        const ageInYears = (new Date() - installDate) / (1000 * 60 * 60 * 24 * 365.25);

        let recommendedTier = '';
        let sectionName = '';
        let servicesIncluded = [];

        // --- STEP 1: Classify Capacity (Section 1-4) ---
        // Mapping roughly to our DB Plans:
        // 1-3kW -> Basic
        // 3-6kW -> Gold
        // 6kW+ -> Platinum

        if (capacity <= 3) {
            recommendedTier = 'Basic';
            sectionName = 'Section 1 (1-3 kW)';
            servicesIncluded = ['3 cleanings/year', '1 inverter inspection', 'Wiring check'];
        } else if (capacity <= 6) {
            recommendedTier = 'Gold';
            sectionName = 'Section 2 (3-6 kW)';
            servicesIncluded = ['4 cleanings/year', '2 inverter inspections', 'Priority support'];
        } else {
            recommendedTier = 'Platinum';
            sectionName = 'Section 3 (6+ kW)';
            servicesIncluded = ['6 cleanings/year', 'Detailed Performance Report', 'VIP Support'];
        }

        // --- STEP 2: Logic & Reasoning ---
        let durationReason = '';
        let durationFocus = '';

        if (ageInYears < 2) {
            durationReason = `Your system is new (${ageInYears.toFixed(1)} years old). We recommend locking in protection early.`;
            durationFocus = 'Value Protection';
        } else if (ageInYears < 5) {
            durationReason = `Your system is in its prime (${ageInYears.toFixed(1)} years old). Regular inspections are crucial now.`;
            durationFocus = 'Inspection Focus';
        } else {
            durationReason = `Your system is aging (${ageInYears.toFixed(1)} years old). Preventive maintenance is key to extend life.`;
            durationFocus = 'Preventive Care';
        }

        // --- STEP 3: Find Best Match in Inventory ---
        // We look for a plan that contains our Tier Name (Basic/Gold/Platinum)
        const matchedPlan = availablePlans.find(p => p.name.includes(recommendedTier)) || availablePlans[0];

        return {
            recommendedPlanId: matchedPlan.id,
            tier: recommendedTier,
            section: sectionName,
            message: `Based on your ${capacity}kW system size and age.`,
            reasoning: durationReason,
            focus: durationFocus,
            highlights: servicesIncluded
        };
    }
};
