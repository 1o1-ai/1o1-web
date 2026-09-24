/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Curated CBSE Class 10 multiple-choice bank (Science 086 + Mathematics 041).
  Every entry is self-contained: no figure/diagram dependency, single correct
  option, and a one-line explanation used for post-answer feedback.

  Shape: { s: subject, ch: chapterId, chT: chapterTitle, q, o[4], a: correctIndex, d: 1|2|3, e: explanation }
*/
(function () {
  'use strict';

  var SCIENCE = [
    // ── Chemical Reactions and Equations ──────────────────────────────
    ['chem-reactions', 'Chemical Reactions and Equations', 'Fe + CuSO₄ → FeSO₄ + Cu is an example of which type of reaction?', ['Displacement', 'Combination', 'Decomposition', 'Double displacement'], 0, 1, 'Iron is more reactive than copper, so it displaces copper from its salt solution.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'Chips packets are flushed with which gas to prevent rancidity?', ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Chlorine'], 0, 1, 'Nitrogen is unreactive and displaces oxygen, preventing oxidation of fats and oils.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'Respiration is classified as which kind of reaction?', ['Exothermic', 'Endothermic', 'Photolytic', 'Neutralisation'], 0, 1, 'Glucose is oxidised to release energy, so heat is given out — an exothermic change.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'Heating lead nitrate produces brown fumes of which gas?', ['Nitrogen dioxide', 'Nitrogen', 'Oxygen', 'Nitrous oxide'], 0, 2, '2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂; the brown fumes are nitrogen dioxide.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'When white silver chloride is left in sunlight it turns grey. This is:', ['Photolytic decomposition', 'Thermal decomposition', 'Combination', 'Displacement'], 0, 2, 'Light energy decomposes AgCl into silver metal (grey) and chlorine gas.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'Which two substances are together necessary for the rusting of iron?', ['Oxygen and water', 'Oxygen and nitrogen', 'Water and carbon dioxide', 'Nitrogen and water'], 0, 1, 'Rusting is oxidation of iron in the presence of both moisture and atmospheric oxygen.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'In the reaction 3Fe + 4H₂O → Fe₃O₄ + 4H₂, water is acting as:', ['An oxidising agent', 'A reducing agent', 'A catalyst', 'A base'], 0, 3, 'Water oxidises iron to Fe₃O₄ while itself being reduced to hydrogen gas.'],
    ['chem-reactions', 'Chemical Reactions and Equations', 'Burning of magnesium ribbon in air is which type of reaction?', ['Combination', 'Decomposition', 'Displacement', 'Double displacement'], 0, 1, 'Magnesium combines with oxygen to form a single product, magnesium oxide.'],

    // ── Acids, Bases and Salts ────────────────────────────────────────
    ['acids-bases', 'Acids, Bases and Salts', 'What is the pH of pure water at 25 °C?', ['7', '0', '14', '5'], 0, 1, 'Pure water is neutral, with equal H⁺ and OH⁻ concentrations, giving pH 7.'],
    ['acids-bases', 'Acids, Bases and Salts', 'The chemical name of baking soda is:', ['Sodium hydrogencarbonate', 'Sodium carbonate', 'Sodium hydroxide', 'Calcium carbonate'], 0, 1, 'Baking soda is NaHCO₃, sodium hydrogencarbonate.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Which compound is used for disinfecting drinking water?', ['Bleaching powder', 'Baking soda', 'Washing soda', 'Plaster of Paris'], 0, 1, 'Bleaching powder, CaOCl₂, releases chlorine which disinfects water.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Plaster of Paris is represented by the formula:', ['CaSO₄·½H₂O', 'CaSO₄·2H₂O', 'CaSO₄', 'CaCO₃'], 0, 2, 'It is calcium sulphate hemihydrate — half a water molecule per formula unit.'],
    ['acids-bases', 'Acids, Bases and Salts', 'A metal reacting with a dilute acid always releases which gas?', ['Hydrogen', 'Oxygen', 'Carbon dioxide', 'Chlorine'], 0, 1, 'Metal + dilute acid → salt + hydrogen gas, which burns with a pop sound.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Tooth decay begins when the pH of the mouth falls below:', ['5.5', '7.0', '6.8', '4.0'], 0, 2, 'Below pH 5.5 the tooth enamel (calcium phosphate) starts to corrode.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Washing soda has the formula:', ['Na₂CO₃·10H₂O', 'NaHCO₃', 'Na₂CO₃', 'NaOH'], 0, 2, 'Washing soda is sodium carbonate decahydrate, with ten water molecules of crystallisation.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Among solutions of pH 2, 5, 9 and 12, which is the most acidic?', ['pH 2', 'pH 5', 'pH 9', 'pH 12'], 0, 1, 'The lower the pH, the higher the H⁺ concentration and the stronger the acid.'],
    ['acids-bases', 'Acids, Bases and Salts', 'Which acid is present in the stomach and helps digestion?', ['Hydrochloric acid', 'Acetic acid', 'Citric acid', 'Lactic acid'], 0, 1, 'Dilute HCl in gastric juice activates enzymes and kills bacteria.'],

    // ── Metals and Non-metals ─────────────────────────────────────────
    ['metals', 'Metals and Non-metals', 'Which metal is the best conductor of electricity?', ['Silver', 'Copper', 'Aluminium', 'Gold'], 0, 1, 'Silver has the highest electrical conductivity of all metals.'],
    ['metals', 'Metals and Non-metals', 'Aluminium resists corrosion because it forms a protective layer of:', ['Aluminium oxide', 'Aluminium chloride', 'Aluminium sulphide', 'Aluminium hydroxide'], 0, 2, 'A thin, tough Al₂O₃ layer forms instantly and seals the metal beneath.'],
    ['metals', 'Metals and Non-metals', 'The thermite reaction, used to weld railway tracks, uses aluminium with:', ['Ferric oxide', 'Copper oxide', 'Zinc oxide', 'Lead oxide'], 0, 2, 'Al reduces Fe₂O₃ in a highly exothermic reaction that yields molten iron.'],
    ['metals', 'Metals and Non-metals', 'Which of these is an amphoteric oxide?', ['Al₂O₃', 'Na₂O', 'MgO', 'CaO'], 0, 2, 'Aluminium oxide reacts with both acids and bases, so it is amphoteric.'],
    ['metals', 'Metals and Non-metals', 'Which non-metal conducts electricity?', ['Graphite', 'Sulphur', 'Phosphorus', 'Iodine'], 0, 1, 'In graphite each carbon has a free delocalised electron, allowing conduction.'],
    ['metals', 'Metals and Non-metals', 'Coating iron with a layer of zinc to prevent rusting is called:', ['Galvanisation', 'Alloying', 'Anodising', 'Electroplating with tin'], 0, 1, 'Zinc is more reactive and corrodes sacrificially, protecting the iron.'],
    ['metals', 'Metals and Non-metals', 'Aqua regia is a mixture of concentrated HCl and HNO₃ in the ratio:', ['3 : 1', '1 : 3', '1 : 1', '2 : 1'], 0, 2, 'Three parts conc. HCl to one part conc. HNO₃ — it can dissolve gold and platinum.'],
    ['metals', 'Metals and Non-metals', 'Ionic compounds generally have high melting points because:', ['Strong electrostatic forces hold the ions', 'They are covalent', 'They are gases', 'They have free electrons'], 0, 2, 'Large amounts of energy are needed to overcome the strong ion–ion attraction.'],
    ['metals', 'Metals and Non-metals', 'Which metal is a liquid at room temperature?', ['Mercury', 'Sodium', 'Bromine', 'Gallium'], 0, 1, 'Mercury is the only metal that is liquid at ordinary room temperature.'],

    // ── Carbon and its Compounds ──────────────────────────────────────
    ['carbon', 'Carbon and its Compounds', 'The ability of carbon to form long chains with itself is called:', ['Catenation', 'Isomerism', 'Tetravalency', 'Allotropy'], 0, 1, 'Catenation lets carbon build chains, branches and rings, giving millions of compounds.'],
    ['carbon', 'Carbon and its Compounds', 'Ethanol reacting with sodium metal releases which gas?', ['Hydrogen', 'Oxygen', 'Carbon dioxide', 'Methane'], 0, 2, '2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂; sodium ethoxide and hydrogen are formed.'],
    ['carbon', 'Carbon and its Compounds', 'Two consecutive members of a homologous series differ by:', ['CH₂ (14 u)', 'CH₃ (15 u)', 'C₂H₂ (26 u)', 'CH (13 u)'], 0, 2, 'Each successive member adds one −CH₂− unit, a mass difference of 14 u.'],
    ['carbon', 'Carbon and its Compounds', 'The general formula of a saturated hydrocarbon (alkane) is:', ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙH₂ₙ₋₂', 'CₙHₙ'], 0, 1, 'Alkanes have only single bonds and follow CₙH₂ₙ₊₂.'],
    ['carbon', 'Carbon and its Compounds', 'An ester is formed when a carboxylic acid reacts with an alcohol in the presence of:', ['Concentrated H₂SO₄', 'Dilute HCl', 'NaOH', 'Water'], 0, 2, 'Conc. sulphuric acid acts as a dehydrating agent in esterification.'],
    ['carbon', 'Carbon and its Compounds', 'Soap forms scum with hard water because hard water contains:', ['Calcium and magnesium salts', 'Sodium salts', 'Potassium salts', 'Dissolved carbon dioxide'], 0, 2, 'Ca²⁺ and Mg²⁺ ions form insoluble salts with soap, seen as scum.'],
    ['carbon', 'Carbon and its Compounds', 'How many structural isomers does butane (C₄H₁₀) have?', ['2', '3', '4', '1'], 0, 2, 'n-butane and iso-butane (2-methylpropane) are the only two.'],
    ['carbon', 'Carbon and its Compounds', 'The cleaning action of soap is due to the formation of:', ['Micelles', 'Esters', 'Crystals', 'Emulsions of soap'], 0, 2, 'The hydrophobic tails trap oil while hydrophilic heads face water, forming micelles.'],
    ['carbon', 'Carbon and its Compounds', 'Denatured alcohol is ethanol made unfit for drinking by adding:', ['Methanol', 'Water', 'Acetic acid', 'Sugar'], 0, 2, 'Poisonous methanol (and dyes) are added so the ethanol cannot be consumed.'],

    // ── Life Processes ────────────────────────────────────────────────
    ['life', 'Life Processes', 'Photosynthesis takes place in which cell organelle?', ['Chloroplast', 'Mitochondria', 'Ribosome', 'Nucleus'], 0, 1, 'Chloroplasts contain chlorophyll, which captures light energy.'],
    ['life', 'Life Processes', 'Which vessel transports water and minerals in a plant?', ['Xylem', 'Phloem', 'Cambium', 'Cortex'], 0, 1, 'Xylem carries water upward; phloem translocates food.'],
    ['life', 'Life Processes', 'How many chambers does the human heart have?', ['Four', 'Three', 'Two', 'Five'], 0, 1, 'Two atria and two ventricles keep oxygenated and deoxygenated blood separate.'],
    ['life', 'Life Processes', 'The structural and functional unit of the kidney is the:', ['Nephron', 'Neuron', 'Alveolus', 'Villus'], 0, 1, 'Each kidney has about a million nephrons that filter blood to form urine.'],
    ['life', 'Life Processes', 'Bile juice is secreted by the liver and helps in:', ['Emulsification of fats', 'Digestion of starch', 'Digestion of protein', 'Absorption of water'], 0, 2, 'Bile salts break large fat globules into small droplets for lipase to act on.'],
    ['life', 'Life Processes', 'Anaerobic respiration in yeast produces:', ['Ethanol and carbon dioxide', 'Lactic acid', 'Water and carbon dioxide', 'Glucose and oxygen'], 0, 2, 'This is fermentation, used in brewing and baking.'],
    ['life', 'Life Processes', 'The opening and closing of stomata is controlled by:', ['Guard cells', 'Epidermal cells', 'Mesophyll cells', 'Xylem vessels'], 0, 1, 'Guard cells swell and shrink with water, opening and closing the stomatal pore.'],
    ['life', 'Life Processes', 'Muscle cramps after heavy exercise are caused by the build-up of:', ['Lactic acid', 'Ethanol', 'Pyruvate', 'Carbon dioxide'], 0, 2, 'When oxygen runs short, glucose breaks into lactic acid, causing cramps.'],
    ['life', 'Life Processes', 'Blood passes through the human heart twice in one complete cycle. This is called:', ['Double circulation', 'Single circulation', 'Open circulation', 'Portal circulation'], 0, 2, 'Pulmonary and systemic circuits together make double circulation.'],
    ['life', 'Life Processes', 'The absorption of digested food mainly occurs in the:', ['Small intestine', 'Stomach', 'Large intestine', 'Oesophagus'], 0, 1, 'Villi in the small intestine give a huge surface area for absorption.'],

    // ── Control and Coordination ──────────────────────────────────────
    ['control', 'Control and Coordination', 'The structural and functional unit of the nervous system is the:', ['Neuron', 'Nephron', 'Neurotransmitter', 'Synapse'], 0, 1, 'Neurons carry electrical impulses throughout the body.'],
    ['control', 'Control and Coordination', 'Reflex actions are controlled by the:', ['Spinal cord', 'Cerebrum', 'Cerebellum', 'Medulla'], 0, 1, 'The reflex arc routes through the spinal cord for a rapid response.'],
    ['control', 'Control and Coordination', 'Which plant hormone is responsible for phototropism?', ['Auxin', 'Cytokinin', 'Abscisic acid', 'Ethylene'], 0, 2, 'Auxin accumulates on the shaded side, making it elongate and bend the shoot toward light.'],
    ['control', 'Control and Coordination', 'Balance of the body and posture is controlled by the:', ['Cerebellum', 'Cerebrum', 'Medulla', 'Pons'], 0, 2, 'The cerebellum coordinates precision of voluntary action and equilibrium.'],
    ['control', 'Control and Coordination', 'Which hormone is secreted by the pancreas and regulates blood sugar?', ['Insulin', 'Thyroxine', 'Adrenaline', 'Testosterone'], 0, 1, 'Insulin lowers blood glucose; its deficiency causes diabetes mellitus.'],
    ['control', 'Control and Coordination', 'The synthesis of thyroxine requires which element in the diet?', ['Iodine', 'Iron', 'Calcium', 'Zinc'], 0, 2, 'Iodine deficiency leads to goitre because thyroxine cannot be made.'],
    ['control', 'Control and Coordination', 'Involuntary actions such as heartbeat and blood pressure are controlled by the:', ['Medulla', 'Cerebrum', 'Cerebellum', 'Spinal cord'], 0, 2, 'The medulla oblongata in the hindbrain regulates these vital functions.'],
    ['control', 'Control and Coordination', 'The tiny gap between two adjacent neurons is called a:', ['Synapse', 'Dendrite', 'Axon', 'Node'], 0, 1, 'Chemicals released at the synapse carry the impulse to the next neuron.'],
    ['control', 'Control and Coordination', 'Which hormone is known as the stress hormone in plants and inhibits growth?', ['Abscisic acid', 'Auxin', 'Gibberellin', 'Cytokinin'], 0, 2, 'Abscisic acid causes wilting, closes stomata and promotes dormancy.'],

    // ── How do Organisms Reproduce ────────────────────────────────────
    ['reproduce', 'How do Organisms Reproduce?', 'Amoeba reproduces by which method?', ['Binary fission', 'Budding', 'Fragmentation', 'Spore formation'], 0, 1, 'The cell divides into two daughter cells of roughly equal size.'],
    ['reproduce', 'How do Organisms Reproduce?', 'Plasmodium, the malarial parasite, reproduces by:', ['Multiple fission', 'Binary fission', 'Budding', 'Regeneration'], 0, 2, 'One parent cell splits simultaneously into many daughter cells.'],
    ['reproduce', 'How do Organisms Reproduce?', 'Yeast reproduces asexually by:', ['Budding', 'Binary fission', 'Fragmentation', 'Spore formation'], 0, 1, 'A small bud grows on the parent and later detaches.'],
    ['reproduce', 'How do Organisms Reproduce?', 'Spirogyra reproduces by:', ['Fragmentation', 'Budding', 'Binary fission', 'Multiple fission'], 0, 2, 'The filament breaks into pieces, each growing into a new individual.'],
    ['reproduce', 'How do Organisms Reproduce?', 'In humans, fertilisation normally takes place in the:', ['Fallopian tube', 'Uterus', 'Ovary', 'Cervix'], 0, 2, 'The sperm meets the egg in the oviduct; the zygote then implants in the uterus.'],
    ['reproduce', 'How do Organisms Reproduce?', 'The placenta in a pregnant female mainly serves to:', ['Supply nutrients to the embryo', 'Produce eggs', 'Store urine', 'Protect against light'], 0, 1, 'It is the exchange surface for nutrients, oxygen and wastes between mother and embryo.'],
    ['reproduce', 'How do Organisms Reproduce?', 'Plants raised by vegetative propagation are:', ['Genetically identical to the parent', 'Genetically different', 'Always sterile', 'Grown only from seeds'], 0, 2, 'No gametes are involved, so the offspring are clones of the parent plant.'],
    ['reproduce', 'How do Organisms Reproduce?', 'The transfer of pollen from anther to stigma is called:', ['Pollination', 'Fertilisation', 'Germination', 'Regeneration'], 0, 1, 'Pollination precedes fertilisation in flowering plants.'],

    // ── Heredity ──────────────────────────────────────────────────────
    ['heredity', 'Heredity', 'Mendel carried out his classic experiments on which plant?', ['Garden pea', 'Sunflower', 'Maize', 'Rose'], 0, 1, 'Pisum sativum has clear contrasting traits and a short life cycle.'],
    ['heredity', 'Heredity', 'The phenotypic ratio of a monohybrid cross in the F₂ generation is:', ['3 : 1', '1 : 1', '9 : 3 : 3 : 1', '1 : 2 : 1'], 0, 1, 'Three dominant to one recessive is the classic monohybrid F₂ ratio.'],
    ['heredity', 'Heredity', 'The phenotypic ratio of a dihybrid cross in the F₂ generation is:', ['9 : 3 : 3 : 1', '3 : 1', '1 : 1 : 1 : 1', '1 : 2 : 1'], 0, 2, 'Two independently assorting gene pairs give the 9:3:3:1 ratio.'],
    ['heredity', 'Heredity', 'In humans, the sex of a child is determined by:', ['The chromosome inherited from the father', 'The chromosome from the mother', 'The mother’s diet', 'The age of the mother'], 0, 2, 'The mother always contributes X; the father contributes either X or Y.'],
    ['heredity', 'Heredity', 'Different forms of the same gene are called:', ['Alleles', 'Chromatids', 'Genomes', 'Loci'], 0, 1, 'Alleles occupy the same locus on homologous chromosomes.'],
    ['heredity', 'Heredity', 'A recessive trait is expressed only when the individual is:', ['Homozygous recessive', 'Heterozygous', 'Homozygous dominant', 'Hybrid'], 0, 2, 'Both alleles must be recessive for the trait to show.'],

    // ── Light: Reflection and Refraction ──────────────────────────────
    ['light', 'Light — Reflection and Refraction', 'A dentist uses which type of mirror to see an enlarged image of a tooth?', ['Concave', 'Convex', 'Plane', 'Cylindrical'], 0, 1, 'A concave mirror gives a magnified erect image when the object is within the focus.'],
    ['light', 'Light — Reflection and Refraction', 'A rear-view mirror in vehicles is convex because it:', ['Gives a wider field of view', 'Magnifies the image', 'Inverts the image', 'Absorbs light'], 0, 1, 'Convex mirrors always give small, erect images covering a large area.'],
    ['light', 'Light — Reflection and Refraction', 'The refractive index of water is approximately:', ['1.33', '1.00', '1.50', '2.42'], 0, 2, 'Light slows to about three quarters of its vacuum speed in water.'],
    ['light', 'Light — Reflection and Refraction', 'The power of a lens is measured in:', ['Dioptre', 'Metre', 'Watt', 'Newton'], 0, 1, 'P = 1/f with f in metres; the unit of power is the dioptre (D).'],
    ['light', 'Light — Reflection and Refraction', 'A convex lens is also called a:', ['Converging lens', 'Diverging lens', 'Plane lens', 'Cylindrical lens'], 0, 1, 'It brings parallel rays to a real focus and has a positive focal length.'],
    ['light', 'Light — Reflection and Refraction', 'For a spherical mirror, the radius of curvature R is related to focal length f by:', ['R = 2f', 'R = f/2', 'R = f', 'R = 4f'], 0, 1, 'The focus lies midway between the pole and the centre of curvature.'],
    ['light', 'Light — Reflection and Refraction', 'The splitting of white light into its component colours is called:', ['Dispersion', 'Refraction', 'Reflection', 'Scattering'], 0, 1, 'Different colours have different refractive indices, so they bend by different amounts.'],
    ['light', 'Light — Reflection and Refraction', 'The mirror formula is:', ['1/v + 1/u = 1/f', '1/v − 1/u = 1/f', 'v + u = f', 'v/u = f'], 0, 2, 'This relates image distance, object distance and focal length for spherical mirrors.'],
    ['light', 'Light — Reflection and Refraction', 'A lens of focal length +20 cm has a power of:', ['+5 D', '+20 D', '+0.5 D', '−5 D'], 0, 3, 'P = 1/f in metres = 1/0.20 = +5 dioptre.'],

    // ── Human Eye and the Colourful World ─────────────────────────────
    ['eye', 'The Human Eye and the Colourful World', 'Myopia (short-sightedness) is corrected using a:', ['Concave lens', 'Convex lens', 'Cylindrical lens', 'Bifocal lens'], 0, 1, 'A diverging lens moves the image back onto the retina.'],
    ['eye', 'The Human Eye and the Colourful World', 'Hypermetropia (long-sightedness) is corrected using a:', ['Convex lens', 'Concave lens', 'Plane mirror', 'Prism'], 0, 1, 'A converging lens brings the image forward onto the retina.'],
    ['eye', 'The Human Eye and the Colourful World', 'The least distance of distinct vision for a normal adult eye is:', ['25 cm', '25 m', '2.5 cm', 'Infinity'], 0, 1, 'Objects closer than about 25 cm cannot be focused comfortably.'],
    ['eye', 'The Human Eye and the Colourful World', 'The ability of the eye lens to change its focal length is called:', ['Accommodation', 'Persistence of vision', 'Dispersion', 'Adaptation'], 0, 1, 'Ciliary muscles change the curvature of the lens to focus near and far objects.'],
    ['eye', 'The Human Eye and the Colourful World', 'The sky appears blue because:', ['Blue light is scattered most by air molecules', 'The sea reflects on the sky', 'Blue light travels fastest', 'Air absorbs red light'], 0, 2, 'Scattering is strongest for shorter wavelengths, and blue dominates the scattered light.'],
    ['eye', 'The Human Eye and the Colourful World', 'Red is used for danger signals because red light:', ['Is scattered the least and travels farthest', 'Is the brightest colour', 'Is scattered the most', 'Is absorbed by fog'], 0, 2, 'Long-wavelength red penetrates haze and remains visible from a distance.'],
    ['eye', 'The Human Eye and the Colourful World', 'The twinkling of stars is caused by:', ['Atmospheric refraction', 'Dispersion', 'Total internal reflection', 'Diffraction'], 0, 2, 'Changing air densities continuously refract starlight, so brightness fluctuates.'],
    ['eye', 'The Human Eye and the Colourful World', 'The amount of light entering the eye is controlled by the:', ['Iris', 'Cornea', 'Retina', 'Optic nerve'], 0, 1, 'The iris adjusts the size of the pupil according to light intensity.'],
    ['eye', 'The Human Eye and the Colourful World', 'Presbyopia in old age is usually corrected by:', ['Bifocal lenses', 'Concave lenses only', 'Convex lenses only', 'Coloured lenses'], 0, 2, 'Bifocals have a concave upper part for distance and a convex lower part for reading.'],

    // ── Electricity ───────────────────────────────────────────────────
    ['electricity', 'Electricity', 'Ohm’s law states that:', ['V = IR', 'V = I/R', 'I = VR', 'R = VI'], 0, 1, 'At constant temperature, potential difference is directly proportional to current.'],
    ['electricity', 'Electricity', 'The SI unit of electrical resistance is the:', ['Ohm', 'Volt', 'Ampere', 'Watt'], 0, 1, 'One ohm is one volt per ampere.'],
    ['electricity', 'Electricity', 'The resistance of a wire is:', ['Directly proportional to length, inversely to area', 'Directly proportional to area', 'Independent of length', 'Inversely proportional to length'], 0, 2, 'R = ρL/A, so a longer or thinner wire has more resistance.'],
    ['electricity', 'Electricity', 'In a series circuit, which quantity is the same through every component?', ['Current', 'Voltage', 'Resistance', 'Power'], 0, 1, 'There is only one path, so the same current flows everywhere.'],
    ['electricity', 'Electricity', 'Two resistors of 4 Ω each connected in parallel give an equivalent resistance of:', ['2 Ω', '8 Ω', '4 Ω', '16 Ω'], 0, 2, '1/R = 1/4 + 1/4 = 1/2, so R = 2 Ω.'],
    ['electricity', 'Electricity', 'Electrical power is given by:', ['P = VI', 'P = V/I', 'P = I/V', 'P = V + I'], 0, 1, 'Equivalent forms are P = I²R and P = V²/R.'],
    ['electricity', 'Electricity', 'One kilowatt-hour is equal to:', ['3.6 × 10⁶ J', '3.6 × 10³ J', '1000 J', '10⁶ J'], 0, 3, '1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ joule.'],
    ['electricity', 'Electricity', 'An ammeter and a voltmeter are connected respectively in:', ['Series and parallel', 'Parallel and series', 'Both in series', 'Both in parallel'], 0, 2, 'An ammeter must carry the current; a voltmeter must sample the potential difference.'],
    ['electricity', 'Electricity', 'A 60 W bulb operating on 220 V draws a current of about:', ['0.27 A', '3.7 A', '13 A', '1.2 A'], 0, 3, 'I = P/V = 60/220 ≈ 0.27 ampere.'],

    // ── Magnetic Effects of Electric Current ──────────────────────────
    ['magnetic', 'Magnetic Effects of Electric Current', 'The direction of the magnetic field around a straight current-carrying wire is given by:', ['Right-hand thumb rule', 'Fleming’s left-hand rule', 'Lenz’s law', 'Ohm’s law'], 0, 1, 'Point the thumb along the current; the curled fingers show the field direction.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'Fleming’s left-hand rule is applied in the working of an electric:', ['Motor', 'Generator', 'Transformer', 'Fuse'], 0, 2, 'It gives the direction of force on a current-carrying conductor in a magnetic field.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'Fleming’s right-hand rule is applied in an electric:', ['Generator', 'Motor', 'Heater', 'Bulb'], 0, 2, 'It gives the direction of induced current in electromagnetic induction.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'The magnetic field inside a long current-carrying solenoid is:', ['Uniform and parallel to the axis', 'Zero everywhere', 'Circular', 'Strongest at the centre only'], 0, 2, 'Field lines inside are straight and evenly spaced, like those of a bar magnet.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'In household wiring, the earth wire is coloured:', ['Green', 'Red', 'Black', 'Blue'], 0, 1, 'The green earth wire provides a low-resistance path to the ground for safety.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'Two magnetic field lines can never intersect because:', ['A compass cannot point in two directions at once', 'They repel each other', 'They are imaginary', 'They carry current'], 0, 2, 'At any point the field has one unique direction.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'The AC supply in India has a frequency of:', ['50 Hz', '60 Hz', '100 Hz', '25 Hz'], 0, 1, 'It changes direction 100 times per second, i.e. 50 complete cycles.'],
    ['magnetic', 'Magnetic Effects of Electric Current', 'A fuse wire melts during a short circuit because of:', ['The heating effect of a very large current', 'The magnetic effect', 'The chemical effect', 'Static charge'], 0, 2, 'Heat produced is I²Rt, and the surge current melts the low-melting fuse wire.'],

    // ── Sources of Energy ─────────────────────────────────────────────
    ['sources-of-energy', 'Sources of Energy', 'Biogas is mainly composed of:', ['Methane', 'Carbon dioxide', 'Hydrogen', 'Butane'], 0, 1, 'About 75% of biogas is methane, which makes it an excellent fuel.'],
    ['sources-of-energy', 'Sources of Energy', 'A solar cooker uses a glass sheet on top mainly to:', ['Trap infrared radiation inside', 'Reflect sunlight away', 'Keep dust out only', 'Filter ultraviolet light'], 0, 2, 'Glass lets visible light in but blocks the re-radiated infrared — the greenhouse effect.'],
    ['sources-of-energy', 'Sources of Energy', 'Which of these is a non-renewable source of energy?', ['Coal', 'Wind', 'Solar', 'Tidal'], 0, 1, 'Fossil fuels take millions of years to form and cannot be replenished in our lifetime.'],
    ['sources-of-energy', 'Sources of Energy', 'Nuclear energy in a reactor is produced by the fission of:', ['Uranium', 'Carbon', 'Hydrogen', 'Helium'], 0, 2, 'Uranium-235 nuclei split when struck by slow neutrons, releasing huge energy.'],
    ['sources-of-energy', 'Sources of Energy', 'The solar constant is approximately:', ['1.4 kJ per second per square metre', '14 kJ per second per square metre', '0.14 kJ per second per square metre', '140 kJ per second per square metre'], 0, 3, 'This is the solar energy received per unit area at the top of the atmosphere.'],

    // ── Our Environment ───────────────────────────────────────────────
    ['environment', 'Our Environment', 'According to the ten per cent law, energy transferred to the next trophic level is:', ['10%', '90%', '50%', '1%'], 0, 1, 'Only about a tenth of the energy passes on; the rest is lost as heat and in life processes.'],
    ['environment', 'Our Environment', 'The ozone layer protects us by absorbing:', ['Ultraviolet radiation', 'Infrared radiation', 'Visible light', 'Radio waves'], 0, 1, 'O₃ absorbs harmful UV that would otherwise cause skin cancer.'],
    ['environment', 'Our Environment', 'Ozone depletion is mainly caused by:', ['Chlorofluorocarbons', 'Carbon dioxide', 'Methane', 'Sulphur dioxide'], 0, 2, 'CFCs release chlorine atoms that catalytically destroy ozone molecules.'],
    ['environment', 'Our Environment', 'Food chains rarely have more than four or five trophic levels because:', ['Energy available decreases sharply at each level', 'Animals cannot find food', 'Producers are limited', 'Decomposers stop the chain'], 0, 2, 'With only 10% transferred each step, too little energy remains to support higher levels.'],
    ['environment', 'Our Environment', 'Which of these is a biodegradable substance?', ['Paper', 'Polythene', 'Aluminium foil', 'Glass'], 0, 1, 'Paper is broken down by microorganisms; the others are not.'],
    ['environment', 'Our Environment', 'Organisms that break down dead remains into simple substances are called:', ['Decomposers', 'Producers', 'Herbivores', 'Carnivores'], 0, 1, 'Bacteria and fungi recycle nutrients back into the ecosystem.'],
  ];

  var MATH = [
    // ── Real Numbers ──────────────────────────────────────────────────
    ['real-numbers', 'Real Numbers', 'For two positive integers a and b, HCF(a, b) × LCM(a, b) equals:', ['a × b', 'a + b', 'a − b', 'a ÷ b'], 0, 1, 'The product of the HCF and LCM of two numbers always equals their product.'],
    ['real-numbers', 'Real Numbers', 'The HCF of 6 and 20 is:', ['2', '4', '6', '10'], 0, 1, '6 = 2 × 3 and 20 = 2² × 5; the only common prime factor is 2.'],
    ['real-numbers', 'Real Numbers', 'The LCM of 12 and 18 is:', ['36', '24', '54', '72'], 0, 1, '12 = 2² × 3, 18 = 2 × 3²; LCM takes the highest power of each: 2² × 3² = 36.'],
    ['real-numbers', 'Real Numbers', '√2 is:', ['An irrational number', 'A rational number', 'An integer', 'A natural number'], 0, 1, 'It cannot be written as p/q with integers p and q, q ≠ 0.'],
    ['real-numbers', 'Real Numbers', 'A rational number p/q has a terminating decimal expansion only if q is of the form:', ['2ⁿ5ᵐ', '3ⁿ7ᵐ', '2ⁿ3ᵐ', '5ⁿ7ᵐ'], 0, 2, 'Only prime factors 2 and 5 in the denominator give a terminating decimal.'],
    ['real-numbers', 'Real Numbers', 'The Fundamental Theorem of Arithmetic states that every composite number can be expressed as:', ['A unique product of primes', 'A sum of two primes', 'A product of two even numbers', 'A power of a single prime'], 0, 2, 'The factorisation into primes is unique apart from the order of the factors.'],

    // ── Polynomials ───────────────────────────────────────────────────
    ['polynomials', 'Polynomials', 'For the quadratic polynomial ax² + bx + c, the sum of the zeroes is:', ['−b/a', 'b/a', 'c/a', '−c/a'], 0, 1, 'Sum of zeroes = −(coefficient of x)/(coefficient of x²).'],
    ['polynomials', 'Polynomials', 'For the quadratic polynomial ax² + bx + c, the product of the zeroes is:', ['c/a', '−c/a', 'b/a', '−b/a'], 0, 1, 'Product of zeroes = (constant term)/(coefficient of x²).'],
    ['polynomials', 'Polynomials', 'The zeroes of x² − 3x − 4 are:', ['4 and −1', '−4 and 1', '2 and −2', '3 and −1'], 0, 2, 'x² − 3x − 4 = (x − 4)(x + 1), so the zeroes are 4 and −1.'],
    ['polynomials', 'Polynomials', 'The maximum number of zeroes a cubic polynomial can have is:', ['3', '2', '1', '4'], 0, 1, 'A polynomial of degree n has at most n zeroes.'],
    ['polynomials', 'Polynomials', 'A quadratic polynomial whose zeroes have sum −3 and product 2 is:', ['x² + 3x + 2', 'x² − 3x + 2', 'x² + 3x − 2', 'x² − 3x − 2'], 0, 2, 'The polynomial is x² − (sum)x + product = x² + 3x + 2.'],
    ['polynomials', 'Polynomials', 'The number of zeroes of a polynomial equals the number of points where its graph:', ['Intersects the x-axis', 'Intersects the y-axis', 'Turns', 'Is above the x-axis'], 0, 1, 'A zero is a value of x for which y = 0, i.e. an x-intercept.'],

    // ── Pair of Linear Equations ──────────────────────────────────────
    ['linear-eq', 'Pair of Linear Equations in Two Variables', 'If a₁/a₂ = b₁/b₂ ≠ c₁/c₂, the pair of linear equations has:', ['No solution', 'A unique solution', 'Infinitely many solutions', 'Exactly two solutions'], 0, 2, 'The lines are parallel and never meet, so the system is inconsistent.'],
    ['linear-eq', 'Pair of Linear Equations in Two Variables', 'If a₁/a₂ ≠ b₁/b₂, the pair of linear equations has:', ['A unique solution', 'No solution', 'Infinitely many solutions', 'No real solution'], 0, 2, 'The lines intersect at exactly one point.'],
    ['linear-eq', 'Pair of Linear Equations in Two Variables', 'If a₁/a₂ = b₁/b₂ = c₁/c₂, the two lines are:', ['Coincident, with infinitely many solutions', 'Parallel, with no solution', 'Perpendicular', 'Intersecting at one point'], 0, 2, 'The equations represent the same line, so every point on it is a solution.'],
    ['linear-eq', 'Pair of Linear Equations in Two Variables', 'The solution of x + y = 10 and x − y = 4 is:', ['x = 7, y = 3', 'x = 3, y = 7', 'x = 6, y = 4', 'x = 5, y = 5'], 0, 2, 'Adding gives 2x = 14 so x = 7, and then y = 3.'],

    // ── Quadratic Equations ───────────────────────────────────────────
    ['quadratic', 'Quadratic Equations', 'The discriminant of ax² + bx + c = 0 is:', ['b² − 4ac', 'b² + 4ac', '4ac − b²', '√(b² − 4ac)'], 0, 1, 'The discriminant D = b² − 4ac decides the nature of the roots.'],
    ['quadratic', 'Quadratic Equations', 'If the discriminant is zero, the quadratic equation has:', ['Two equal real roots', 'Two distinct real roots', 'No real roots', 'Three roots'], 0, 1, 'D = 0 gives a repeated root x = −b/2a.'],
    ['quadratic', 'Quadratic Equations', 'If b² − 4ac < 0, the quadratic equation has:', ['No real roots', 'Two distinct real roots', 'Two equal roots', 'One real root'], 0, 2, 'The square root of a negative number is not real, so no real roots exist.'],
    ['quadratic', 'Quadratic Equations', 'The roots of x² − 5x + 6 = 0 are:', ['2 and 3', '−2 and −3', '1 and 6', '−1 and −6'], 0, 1, 'x² − 5x + 6 = (x − 2)(x − 3).'],
    ['quadratic', 'Quadratic Equations', 'The quadratic formula for the roots of ax² + bx + c = 0 is:', ['(−b ± √(b² − 4ac)) / 2a', '(b ± √(b² − 4ac)) / 2a', '(−b ± √(b² + 4ac)) / 2a', '(−b ± √(4ac − b²)) / 2a'], 0, 2, 'This comes from completing the square on the general quadratic.'],

    // ── Arithmetic Progressions ───────────────────────────────────────
    ['ap', 'Arithmetic Progressions', 'The nth term of an AP with first term a and common difference d is:', ['a + (n − 1)d', 'a + nd', 'a − (n − 1)d', 'na + d'], 0, 1, 'Each step adds one more d, and the first term needs no addition.'],
    ['ap', 'Arithmetic Progressions', 'The sum of the first n terms of an AP is:', ['n/2 [2a + (n − 1)d]', 'n [2a + (n − 1)d]', 'n/2 [a + (n − 1)d]', 'n/2 [2a + nd]'], 0, 2, 'Equivalently Sₙ = n/2 (first term + last term).'],
    ['ap', 'Arithmetic Progressions', 'For the AP 3, 7, 11, 15, …, the common difference is:', ['4', '3', '7', '−4'], 0, 1, 'd = 7 − 3 = 4.'],
    ['ap', 'Arithmetic Progressions', 'The 10th term of the AP 3, 7, 11, 15, … is:', ['39', '43', '37', '40'], 0, 2, 'a₁₀ = 3 + 9 × 4 = 39.'],
    ['ap', 'Arithmetic Progressions', 'The sum of the first n natural numbers is:', ['n(n + 1)/2', 'n(n − 1)/2', 'n²', 'n(n + 1)'], 0, 2, 'This is the AP 1, 2, 3, … with a = 1 and d = 1.'],

    // ── Triangles ─────────────────────────────────────────────────────
    ['triangles', 'Triangles', 'The Basic Proportionality Theorem is also known as:', ['Thales theorem', 'Pythagoras theorem', 'Euclid’s theorem', 'Ceva’s theorem'], 0, 1, 'A line parallel to one side of a triangle divides the other two sides proportionally.'],
    ['triangles', 'Triangles', 'The ratio of the areas of two similar triangles equals the ratio of:', ['The squares of their corresponding sides', 'Their corresponding sides', 'The cubes of their sides', 'Their perimeters'], 0, 2, 'Area scales as the square of any linear dimension.'],
    ['triangles', 'Triangles', 'In a right triangle, the square on the hypotenuse equals:', ['The sum of the squares on the other two sides', 'The sum of the other two sides', 'The product of the other two sides', 'Twice the sum of the other two sides'], 0, 1, 'This is the Pythagoras theorem.'],
    ['triangles', 'Triangles', 'Two triangles are similar if their corresponding angles are equal. This criterion is:', ['AAA', 'SSS congruence', 'RHS', 'ASA congruence'], 0, 1, 'Equal angles force the sides into the same ratio.'],
    ['triangles', 'Triangles', 'If two similar triangles have sides in the ratio 2 : 3, their areas are in the ratio:', ['4 : 9', '2 : 3', '8 : 27', '3 : 2'], 0, 2, 'Ratio of areas = (2/3)² = 4/9.'],

    // ── Coordinate Geometry ───────────────────────────────────────────
    ['coordinate', 'Coordinate Geometry', 'The distance between the points (x₁, y₁) and (x₂, y₂) is:', ['√[(x₂ − x₁)² + (y₂ − y₁)²]', '(x₂ − x₁) + (y₂ − y₁)', '√[(x₂ + x₁)² + (y₂ + y₁)²]', '(x₂ − x₁)² + (y₂ − y₁)²'], 0, 1, 'This follows from applying Pythagoras to the horizontal and vertical gaps.'],
    ['coordinate', 'Coordinate Geometry', 'The distance of the point (3, 4) from the origin is:', ['5', '7', '3', '4'], 0, 1, '√(3² + 4²) = √25 = 5.'],
    ['coordinate', 'Coordinate Geometry', 'The midpoint of the line joining (x₁, y₁) and (x₂, y₂) is:', ['((x₁ + x₂)/2, (y₁ + y₂)/2)', '((x₁ − x₂)/2, (y₁ − y₂)/2)', '(x₁ + x₂, y₁ + y₂)', '((x₁ × x₂)/2, (y₁ × y₂)/2)'], 0, 1, 'The midpoint is the average of the coordinates.'],
    ['coordinate', 'Coordinate Geometry', 'The point that divides the join of (x₁, y₁) and (x₂, y₂) in the ratio m : n has x-coordinate:', ['(mx₂ + nx₁)/(m + n)', '(mx₁ + nx₂)/(m + n)', '(mx₂ − nx₁)/(m − n)', '(x₁ + x₂)/(m + n)'], 0, 3, 'This is the section formula for internal division.'],
    ['coordinate', 'Coordinate Geometry', 'The midpoint of the line joining (2, 3) and (6, 7) is:', ['(4, 5)', '(8, 10)', '(3, 4)', '(2, 2)'], 0, 1, '((2 + 6)/2, (3 + 7)/2) = (4, 5).'],

    // ── Trigonometry ──────────────────────────────────────────────────
    ['trigonometry', 'Introduction to Trigonometry', 'The value of sin²θ + cos²θ is:', ['1', '0', '2', 'tan²θ'], 0, 1, 'This is the fundamental Pythagorean identity.'],
    ['trigonometry', 'Introduction to Trigonometry', 'The value of sin 30° is:', ['1/2', '√3/2', '1', '1/√2'], 0, 1, 'From the 30–60–90 triangle, the side opposite 30° is half the hypotenuse.'],
    ['trigonometry', 'Introduction to Trigonometry', 'The value of tan 45° is:', ['1', '0', '√3', '1/√3'], 0, 1, 'At 45° the opposite and adjacent sides are equal.'],
    ['trigonometry', 'Introduction to Trigonometry', 'The value of sec²θ − tan²θ is:', ['1', '0', '−1', 'sec θ'], 0, 2, 'Dividing sin²θ + cos²θ = 1 by cos²θ gives 1 + tan²θ = sec²θ.'],
    ['trigonometry', 'Introduction to Trigonometry', 'tan θ can be written as:', ['sin θ / cos θ', 'cos θ / sin θ', '1 / sin θ', 'sin θ × cos θ'], 0, 1, 'By definition, tangent is the ratio of sine to cosine.'],
    ['trigonometry', 'Introduction to Trigonometry', 'The value of cos 90° is:', ['0', '1', '1/2', '√3/2'], 0, 1, 'Cosine decreases from 1 at 0° to 0 at 90°.'],
    ['trigonometry', 'Introduction to Trigonometry', 'The value of sin 60° × cos 30° is:', ['3/4', '1/2', '√3/2', '1'], 0, 3, '(√3/2) × (√3/2) = 3/4.'],
    ['trigonometry', 'Introduction to Trigonometry', 'cot θ is the reciprocal of:', ['tan θ', 'sin θ', 'cos θ', 'sec θ'], 0, 1, 'cot θ = 1/tan θ = cos θ / sin θ.'],

    // ── Applications of Trigonometry ──────────────────────────────────
    ['trig-apps', 'Some Applications of Trigonometry', 'The angle of elevation of the top of a tower is measured from a point:', ['On the ground, looking upward', 'On the tower, looking downward', 'At the same height as the top', 'Inside the tower'], 0, 1, 'It is the angle between the horizontal and the upward line of sight.'],
    ['trig-apps', 'Some Applications of Trigonometry', 'If the angle of elevation of the top of a tower from a point on the ground is 45°, then the height of the tower is:', ['Equal to its distance from the point', 'Twice its distance', 'Half its distance', '√3 times its distance'], 0, 2, 'tan 45° = height / distance = 1, so height = distance.'],
    ['trig-apps', 'Some Applications of Trigonometry', 'The angle of depression of an object from the top of a tower is measured from:', ['The horizontal line at the top, looking downward', 'The ground, looking up', 'The vertical line', 'The base of the tower'], 0, 2, 'It is the angle between the horizontal and the downward line of sight.'],
    ['trig-apps', 'Some Applications of Trigonometry', 'A 10 m ladder leans against a wall at 60° to the ground. The height it reaches is:', ['5√3 m', '5 m', '10√3 m', '10/√3 m'], 0, 3, 'Height = 10 sin 60° = 10 × (√3/2) = 5√3 m.'],

    // ── Circles ───────────────────────────────────────────────────────
    ['circles', 'Circles', 'A tangent to a circle is perpendicular to the radius at the:', ['Point of contact', 'Centre', 'Midpoint of the chord', 'End of the diameter'], 0, 1, 'This is the fundamental tangent–radius property.'],
    ['circles', 'Circles', 'The lengths of two tangents drawn from an external point to a circle are:', ['Equal', 'In the ratio 1 : 2', 'Always unequal', 'Equal to the radius'], 0, 1, 'The two tangent triangles are congruent by RHS.'],
    ['circles', 'Circles', 'How many tangents can be drawn to a circle from a point outside it?', ['2', '1', '0', 'Infinitely many'], 0, 1, 'Exactly two tangents touch the circle from any external point.'],
    ['circles', 'Circles', 'How many tangents can be drawn to a circle at a given point on the circle?', ['1', '2', '0', 'Infinitely many'], 0, 2, 'There is exactly one tangent line at each point of a circle.'],
    ['circles', 'Circles', 'A line that intersects a circle at two distinct points is called a:', ['Secant', 'Tangent', 'Radius', 'Diameter'], 0, 1, 'A tangent meets the circle at only one point; a secant cuts it at two.'],

    // ── Surface Areas and Volumes ─────────────────────────────────────
    ['surface-volume', 'Surface Areas and Volumes', 'The volume of a sphere of radius r is:', ['4/3 πr³', '4πr²', '2πr³', '1/3 πr³'], 0, 1, 'Surface area is 4πr² while volume is 4/3 πr³.'],
    ['surface-volume', 'Surface Areas and Volumes', 'The curved surface area of a cylinder of radius r and height h is:', ['2πrh', 'πr²h', '2πr(r + h)', 'πrh'], 0, 1, 'Unrolled, the curved surface is a rectangle of width 2πr and height h.'],
    ['surface-volume', 'Surface Areas and Volumes', 'The volume of a cone of radius r and height h is:', ['1/3 πr²h', 'πr²h', '2/3 πr²h', '1/3 πrh'], 0, 1, 'A cone holds exactly one third of the cylinder on the same base and height.'],
    ['surface-volume', 'Surface Areas and Volumes', 'The slant height l of a cone with radius r and height h is:', ['√(r² + h²)', 'r + h', '√(h² − r²)', 'rh'], 0, 2, 'The radius, height and slant height form a right triangle.'],
    ['surface-volume', 'Surface Areas and Volumes', 'The total surface area of a solid hemisphere of radius r is:', ['3πr²', '2πr²', '4πr²', 'πr²'], 0, 2, 'Curved surface 2πr² plus the flat circular base πr² gives 3πr².'],
    ['surface-volume', 'Surface Areas and Volumes', 'The volume of a cube of edge 3 cm is:', ['27 cm³', '9 cm³', '54 cm³', '18 cm³'], 0, 1, 'Volume = side³ = 3³ = 27 cm³.'],

    // ── Statistics ────────────────────────────────────────────────────
    ['statistics', 'Statistics', 'The empirical relationship between mean, median and mode is:', ['Mode = 3 Median − 2 Mean', 'Mode = 3 Mean − 2 Median', 'Mean = 3 Median − 2 Mode', 'Median = 3 Mode − 2 Mean'], 0, 2, 'This approximation holds for moderately skewed distributions.'],
    ['statistics', 'Statistics', 'The mean of a grouped frequency distribution is given by:', ['Σfᵢxᵢ / Σfᵢ', 'Σfᵢ / Σxᵢ', 'Σxᵢ / n', 'Σfᵢxᵢ'], 0, 1, 'Each class mark is weighted by its frequency.'],
    ['statistics', 'Statistics', 'The class mark of a class interval is:', ['(Upper limit + Lower limit) / 2', 'Upper limit − Lower limit', '(Upper limit − Lower limit) / 2', 'Upper limit + Lower limit'], 0, 1, 'The class mark is the midpoint of the interval.'],
    ['statistics', 'Statistics', 'The median of the data 2, 4, 6, 8 is:', ['5', '4', '6', '4.5'], 0, 2, 'With an even count, the median is the mean of the two middle values: (4 + 6)/2 = 5.'],
    ['statistics', 'Statistics', 'The mode of a set of observations is the value that:', ['Occurs most frequently', 'Lies in the middle', 'Is the average', 'Is the largest'], 0, 1, 'Mode is the most frequently occurring observation.'],

    // ── Probability ───────────────────────────────────────────────────
    ['probability', 'Probability', 'For any event E, P(E) + P(not E) equals:', ['1', '0', '0.5', '2'], 0, 1, 'An event and its complement together cover all outcomes.'],
    ['probability', 'Probability', 'The probability of getting a head when a fair coin is tossed once is:', ['1/2', '1', '1/4', '0'], 0, 1, 'There are two equally likely outcomes, one of which is a head.'],
    ['probability', 'Probability', 'The probability of getting an even number when a fair die is rolled is:', ['1/2', '1/3', '1/6', '2/3'], 0, 1, 'Three of the six faces (2, 4, 6) are even, so 3/6 = 1/2.'],
    ['probability', 'Probability', 'The probability of drawing a king from a well-shuffled deck of 52 cards is:', ['1/13', '1/52', '1/4', '4/13'], 0, 2, 'There are 4 kings, so P = 4/52 = 1/13.'],
    ['probability', 'Probability', 'The probability of an impossible event is:', ['0', '1', '0.5', '−1'], 0, 1, 'Probability always lies between 0 (impossible) and 1 (certain).'],
    ['probability', 'Probability', 'The probability of getting a prime number when a fair die is rolled is:', ['1/2', '1/3', '1/6', '2/3'], 0, 3, 'The primes on a die are 2, 3 and 5 — three outcomes out of six.'],
  ];

  function expand(rows, subject, subjectLabel) {
    return rows.map(function (r, i) {
      return {
        id: subject.slice(0, 3) + '-' + i,
        subject: subject,
        subjectLabel: subjectLabel,
        chapter: r[0],
        chapterTitle: r[1],
        question: r[2],
        options: r[3],
        answer: r[4],
        difficulty: r[5],
        explain: r[6],
      };
    });
  }

  var ALL = expand(SCIENCE, 'science', 'Science').concat(expand(MATH, 'mathematics', 'Mathematics'));

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Shuffle option order per-draw so the correct answer is not always first. */
  function randomiseOptions(q) {
    var pairs = q.options.map(function (text, idx) { return { text: text, correct: idx === q.answer }; });
    var mixed = shuffle(pairs);
    return {
      id: q.id,
      subject: q.subject,
      subjectLabel: q.subjectLabel,
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      question: q.question,
      difficulty: q.difficulty,
      explain: q.explain,
      options: mixed.map(function (p) { return p.text; }),
      answer: mixed.findIndex(function (p) { return p.correct; }),
    };
  }

  /*
    draw(opts) -> array of ready-to-render questions.
    opts: { count, subject: 'science'|'mathematics'|'mixed', maxDifficulty, minDifficulty }
  */
  function draw(opts) {
    opts = opts || {};
    var count = opts.count || 10;
    var pool = ALL;

    if (opts.subject && opts.subject !== 'mixed') {
      pool = pool.filter(function (q) { return q.subject === opts.subject; });
    }
    if (opts.minDifficulty) {
      pool = pool.filter(function (q) { return q.difficulty >= opts.minDifficulty; });
    }
    if (opts.maxDifficulty) {
      pool = pool.filter(function (q) { return q.difficulty <= opts.maxDifficulty; });
    }
    if (!pool.length) pool = ALL;

    var picked = shuffle(pool);
    // If more questions are requested than exist, cycle the pool rather than
    // returning a short list — games rely on getting exactly `count` items.
    var out = [];
    while (out.length < count) {
      out = out.concat(picked);
      picked = shuffle(pool);
    }
    return out.slice(0, count).map(randomiseOptions);
  }

  function stats() {
    return {
      total: ALL.length,
      science: ALL.filter(function (q) { return q.subject === 'science'; }).length,
      mathematics: ALL.filter(function (q) { return q.subject === 'mathematics'; }).length,
      chapters: Object.keys(ALL.reduce(function (m, q) { m[q.chapter] = 1; return m; }, {})).length,
    };
  }

  window.CBSE10QuizBank = { all: ALL, draw: draw, shuffle: shuffle, stats: stats };
})();
