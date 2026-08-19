// Static reference data for the dosha detail screen — keyed by the same
// `key` values the detector emits in src/backend/astrology/detect-doshas.ts.
// Keeping this client-safe (no backend imports) so the detail page can render
// it directly.

export const DOSHA_DETAILS = {
  manglik: {
    key: "manglik",
    name: "Manglik Dosha",
    ruler: "Mars (Mangal)",
    intro:
      "Manglik Dosha — also called Kuja Dosha or Bhom Dosha — arises when Mars occupies the 1st, 2nd, 4th, 7th, 8th or 12th house from the ascendant. These are the houses of self, family, home, marriage, longevity and bedroom — the very domains marriage touches.",
    significance:
      "Mars is the planet of energy, courage and assertion. When seated in any of the six sensitive houses, its raw heat is said to inflame conflict in marriage and intimacy. Classical texts treat Manglik as a marital-compatibility flag, not a life curse.",
    whenPresent:
      "You carry Manglik energy. Marriage may bring heat, friction or impulsive decisions in the early years. The fix is matching with a partner whose chart absorbs the Mars heat — typically another Manglik — or following the standard Mars-pacification remedies.",
    whenAbsent:
      "Mars sits outside the Manglik houses in your chart. Marriage decisions are not gated by Mangal Dosha — match-making can proceed on the standard Ashtakoot and emotional-compatibility metrics.",
    effects: [
      "Friction and short-tempered exchanges with the spouse, especially in the first 7 years.",
      "Delayed marriage or repeated breaking of engagements.",
      "Volatility in joint finances and family decisions.",
      "Intimacy-area disturbances if Mars also afflicts the 8th or 12th house.",
      "Stronger ambition, courage and physical energy — the upside of Mars when channeled."
    ],
    remedies: [
      { title: "Hanuman Chalisa on Tuesdays", detail: "Recite the full Chalisa every Tuesday morning after a bath. Hanuman is the antidote deity for Mars-driven anger." },
      { title: "Mangal Beej Mantra", detail: "Chant ‘Om Kram Kreem Kraum Sah Bhaumaya Namah’ 108 times on Tuesday mornings for 40 days." },
      { title: "Donate red items", detail: "Offer red masoor dal, red cloth or jaggery to a needy person on Tuesday." },
      { title: "Kumbh Vivaah", detail: "If marriage is blocked and the dosha is severe, perform a Kumbh Vivaah (symbolic marriage to a clay pot or peepal tree) before the actual wedding." },
      { title: "Match with another Manglik", detail: "Marrying a partner who also has Manglik Dosha cancels the effect — both Mars energies neutralise." },
      { title: "Coral (Moonga)", detail: "Wear a 5–7 carat red coral set in copper on the ring finger of the right hand, on a Tuesday morning, after astrologer consultation." }
    ],
    lucky: {
      color: "Red",
      day: "Tuesday",
      number: 9,
      gemstone: "Red Coral (Moonga)",
      metal: "Copper",
      direction: "South",
      deity: "Lord Hanuman",
      mantra: "Om Angarakaya Namah"
    }
  },

  kaal_sarp: {
    key: "kaal_sarp",
    name: "Kaal Sarp Dosha",
    ruler: "Rahu & Ketu (Lunar nodes)",
    intro:
      "Kaal Sarp Dosha forms when all seven physical planets — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn — are hemmed on one side of the Rahu–Ketu axis. The chart appears swallowed by the cosmic serpent.",
    significance:
      "Rahu and Ketu are karmic accelerators. When they bracket every other planet, life unfolds as a single karmic narrative — high struggle, late success, sudden gains and losses, recurring nightmares of snakes or falling.",
    whenPresent:
      "Your karma this lifetime is concentrated. Effort yields slowly until 28–32, then accelerates. Treat the dosha not as misfortune but as a focused-life signal — and perform the classical Naga puja remedies to soften the early phase.",
    whenAbsent:
      "Planets are spread across both sides of the nodal axis. Karmic acceleration is normal; life progress is paced rather than concentrated.",
    effects: [
      "Delays in career, marriage and house ownership until late 20s or 30s.",
      "Sudden, dramatic gains — and equally sudden losses.",
      "Recurring dreams of snakes, water, falling or being chased.",
      "Family disputes around ancestral property.",
      "Once the dosha is pacified or the saturnine years pass, sharp rise in fortune."
    ],
    remedies: [
      { title: "Kaal Sarp Nivaran Pooja at Trimbakeshwar", detail: "The classical site for this remedy — performed on Nag Panchami or a favourable Panchami tithi by a qualified Pandit." },
      { title: "Mahamrityunjaya Mantra", detail: "Chant ‘Om Tryambakam Yajamahe Sugandhim Pushtivardhanam…’ 108 times daily, ideally facing east at dawn." },
      { title: "Worship of Lord Shiva", detail: "Offer milk and bilva leaves to a Shivling every Monday and on Pradosham." },
      { title: "Naga pratima offering", detail: "Donate a silver snake idol at a Shiva or Subrahmanya temple." },
      { title: "Feed snakes ritually", detail: "On Nag Panchami, offer milk to Naga deities and avoid harming any reptile." },
      { title: "Rahu & Ketu bija mantras", detail: "108 chants each: ‘Om Bhraam Bhreem Bhraum Sah Rahave Namah’ and ‘Om Sraam Sreem Sraum Sah Ketave Namah’." }
    ],
    lucky: {
      color: "Smoky Grey",
      day: "Saturday",
      number: 4,
      gemstone: "Hessonite (Gomed) for Rahu, Cat's Eye (Lehsunia) for Ketu",
      metal: "Silver",
      direction: "South-West",
      deity: "Lord Shiva & Subrahmanya",
      mantra: "Om Namah Shivaya"
    }
  },

  sade_sati: {
    key: "sade_sati",
    name: "Sade Sati",
    ruler: "Saturn (Shani)",
    intro:
      "Sade Sati is the seven-and-a-half-year Saturn transit through the 12th, 1st and 2nd houses from your natal Moon. It is the longest disciplinary cycle in classical astrology.",
    significance:
      "Saturn is the karmic auditor. As he crosses these three signs, he weighs every action, severs what no longer serves you, and rewards integrity. The phase is feared, but those who pass through with patience emerge with the deepest gains of their life.",
    whenPresent:
      "You are inside one of the three Sade Sati phases (Aroh / Madhya / Avaroh). Slow down, reduce risk, focus on duty and discipline. Health, finances and relationships will be tested in turn. This is the lifetime's character-building era.",
    whenAbsent:
      "Saturn is currently outside the 12th–2nd window from your natal Moon. The Saturnian pressure of Sade Sati is not active in your chart at this time.",
    effects: [
      "Career stagnation, layoffs, or forced career pivots — Saturn closes doors only to open better ones.",
      "Loss of close support — family elders pass, friends drift, partners test.",
      "Health flags around bones, joints, teeth, knees, nerves and chronic pains.",
      "Heavier responsibilities, especially around home and ageing parents.",
      "End of phase: tangible, durable rewards — property, position, recognition."
    ],
    remedies: [
      { title: "Hanuman Chalisa & Sundarkand", detail: "Recite Hanuman Chalisa daily and Sundarkand on Saturdays — Hanuman is Saturn's protector deity for devotees." },
      { title: "Shani Stotra (Dasaratha-krit)", detail: "Recite the Dasaratha Krita Shani Stotra on Saturdays — the classical hymn that pacifies Shani." },
      { title: "Donate on Saturdays", detail: "Donate black sesame seeds (til), black cloth, mustard oil, iron, or shoes to a labourer or sweeper." },
      { title: "Light mustard-oil lamp", detail: "On Saturday evenings, light a four-wick mustard-oil lamp under a Peepal tree facing west." },
      { title: "Feed crows and stray dogs", detail: "Saturn's vahana is the crow; offer them food on Saturdays." },
      { title: "Blue Sapphire (Neelam) — only with caution", detail: "Wear only after a strict 3-day trial under astrologer supervision; it is the most powerful but most volatile gem." }
    ],
    lucky: {
      color: "Dark Blue",
      day: "Saturday",
      number: 8,
      gemstone: "Blue Sapphire (Neelam) or Amethyst as substitute",
      metal: "Iron / Steel",
      direction: "West",
      deity: "Lord Shani & Hanuman",
      mantra: "Om Sham Shanaishcharaya Namah"
    },
    duration: "Approximately 7 years 6 months — three phases of 2.5 years each (Aroh, Madhya, Avaroh)."
  },

  pitra_dosha: {
    key: "pitra_dosha",
    name: "Pitra Dosha",
    ruler: "Sun (Surya) & 9th house",
    intro:
      "Pitra Dosha is the karmic flag of unsettled debt to ancestors. It activates when the Sun is afflicted by Rahu, Ketu or Saturn, or when malefics occupy the 9th house — the seat of forefathers and dharma.",
    significance:
      "Hindu tradition sees the lineage as a continuous river. Unfinished obligations from previous generations — incomplete shraddha, broken family promises, harm done to elders — surface as obstacles in the current chart until ritually settled.",
    whenPresent:
      "Pitra Dosha is active. You may notice repeated obstacles in childbirth, family wealth, education or paternal relationships. The remedy is not punishment but offering — ritually settling the ancestral ledger.",
    whenAbsent:
      "The Sun and 9th house are clean of nodal/saturnine affliction. Ancestral karma is balanced; paternal blessings flow freely.",
    effects: [
      "Difficulty conceiving children, or repeated early-life issues for children.",
      "Friction or estrangement with father or paternal elders.",
      "Education and authority figures repeatedly block progress.",
      "Family wealth dissipating across generations.",
      "Recurring dreams of departed relatives asking for something."
    ],
    remedies: [
      { title: "Tarpan on Amavasya", detail: "Offer water mixed with black sesame, barley and kusha grass to ancestors on every new-moon (Amavasya) morning facing south." },
      { title: "Pitru Paksha Shraddha", detail: "During the 16-day Pitru Paksha (Sept–Oct), perform shraddha rituals at home or at Gaya, Haridwar or Kashi." },
      { title: "Feed cows, crows and Brahmins", detail: "On Amavasya, offer rice balls (pind) to crows, then feed cows and a Brahmin couple." },
      { title: "Narayan Bali & Nag Bali", detail: "For severe Pitra Dosha, perform Narayan Bali at Trimbakeshwar — the classical 3-day ancestral pacification." },
      { title: "Plant a Peepal tree", detail: "Plant and water a Peepal sapling; circumambulate it 11 times on Saturdays." },
      { title: "Donate on father's death anniversary", detail: "Annually offer food, clothes or money to a needy elder on the tithi of departed forefathers." }
    ],
    lucky: {
      color: "Saffron / Orange",
      day: "Sunday",
      number: 1,
      gemstone: "Ruby (Manik)",
      metal: "Gold or Copper",
      direction: "East",
      deity: "Lord Vishnu & ancestors (Pitru)",
      mantra: "Om Pitru Devaya Namah"
    }
  },

  guru_chandal: {
    key: "guru_chandal",
    name: "Guru Chandal Dosha",
    ruler: "Jupiter (Guru) afflicted by Rahu/Ketu",
    intro:
      "Guru Chandal Dosha forms when Jupiter — the planet of wisdom, dharma and the inner teacher — is conjoined with Rahu or Ketu within a tight orb. Sacred wisdom is contaminated by shadow.",
    significance:
      "Jupiter rules ethics and discrimination; Rahu rules confusion and ambition without scruple; Ketu rules detachment without wisdom. When they merge, the native's judgement, ethics and teachers become unreliable — until the Jupiter side is consciously strengthened.",
    whenPresent:
      "Your guru-tattva is currently mixed with shadow. Be cautious of charismatic teachers, get-rich-quick mentors and ideologies that promise shortcuts. Strengthen Jupiter actively — the dosha responds well to consistent dharmic practice.",
    whenAbsent:
      "Jupiter is clear of close conjunction with Rahu or Ketu. Guidance and wisdom flow without distortion in your chart.",
    effects: [
      "Misleading teachers, advisors or gurus appearing repeatedly.",
      "Sudden swings in beliefs, religion or philosophy.",
      "Trouble distinguishing genuine wisdom from clever manipulation.",
      "Children's education affected; difficulty completing higher studies.",
      "Loss through stocks, speculation or schemes pitched by a charismatic figure."
    ],
    remedies: [
      { title: "Guru Beej Mantra", detail: "Chant ‘Om Gram Greem Graum Sah Gurave Namah’ 108 times on Thursday mornings for 48 days." },
      { title: "Vishnu Sahasranama", detail: "Recite the 1000 names of Vishnu on Thursdays — Vishnu is Jupiter's deity." },
      { title: "Feed cows on Thursdays", detail: "Offer chana dal, jaggery or fresh grass to a cow every Thursday morning." },
      { title: "Donate yellow items", detail: "Yellow cloth, turmeric, chickpeas (chana), bananas — donate to a Brahmin or temple priest on Thursdays." },
      { title: "Yellow Sapphire (Pukhraj)", detail: "Wear a Pukhraj of 3+ carats in gold on the index finger, only after consultation — it powerfully strengthens Jupiter." },
      { title: "Wear yellow on Thursdays", detail: "Yellow clothing, especially a yellow scarf or thread, anchors Jupiter through the day." }
    ],
    lucky: {
      color: "Yellow",
      day: "Thursday",
      number: 3,
      gemstone: "Yellow Sapphire (Pukhraj)",
      metal: "Gold",
      direction: "North-East",
      deity: "Lord Vishnu / Brihaspati",
      mantra: "Om Brim Brihaspataye Namah"
    }
  },

  shrapit: {
    key: "shrapit",
    name: "Shrapit Dosha",
    ruler: "Saturn + Rahu",
    intro:
      "Shrapit Dosha — literally ‘the cursed one’ — forms when Saturn and Rahu sit conjunct. Two of the slowest, heaviest karmic planets fuse into a long carryover-curse pattern.",
    significance:
      "Classical texts read this as a karmic carry-over from a past life — an unfinished pact, an injustice committed, or a curse from a wronged person. Until the karma is ritually settled, the same situation recreates itself in this life.",
    whenPresent:
      "Recurring obstacles you can't logically explain — same kind of betrayal, same kind of loss, repeating across years. The Shrapit pattern responds to deep ritual remedies; surface fixes don't hold.",
    whenAbsent:
      "Saturn and Rahu are not in tight conjunction. The carryover pattern is not active in this chart.",
    effects: [
      "Same kind of misfortune repeats across years or relationships.",
      "Sudden, unexplained reversals just before a goal completes.",
      "Disturbed sleep, recurring nightmares of being chased or cursed.",
      "Health complaints that resist diagnosis.",
      "Once pacified — exceptional resilience and depth of character."
    ],
    remedies: [
      { title: "Shrapit Dosha Nivaran Pooja", detail: "Performed at Trimbakeshwar or Mahakaleshwar — the classical 3-day rite for carryover karma." },
      { title: "Mahamrityunjaya Japa", detail: "11,000 chants over 21 or 41 days, followed by hawan." },
      { title: "Worship Lord Shiva & Bhairava", detail: "Bhairava (Shiva's fierce form) directly governs Saturn-Rahu darkness." },
      { title: "Feed black dogs", detail: "Bhairava's vahana — offer them sweet bread or milk on Saturdays." },
      { title: "Donate to lepers / needy", detail: "Saturn-Rahu karma releases through humble service to society's most overlooked." },
      { title: "Rudraksha", detail: "Wear a 14-mukhi Rudraksha or a Gauri-Shankar Rudraksha after sanctification." }
    ],
    lucky: {
      color: "Black & Indigo",
      day: "Saturday",
      number: 8,
      gemstone: "Hessonite + Blue Sapphire (paired, expert advice required)",
      metal: "Iron",
      direction: "South-West",
      deity: "Lord Bhairava",
      mantra: "Om Hreem Vatukaya Aapadudharanaya Kuru Kuru Bhairavaya Namah"
    }
  },

  angarak: {
    key: "angarak",
    name: "Angarak Dosha",
    ruler: "Mars + Rahu",
    intro:
      "Angarak Dosha — ‘the burning ember’ — is the conjunction of Mars and Rahu. Mars's heat fused with Rahu's amplification produces a volatile, accident-prone, rage-prone pattern.",
    significance:
      "Mars alone gives controlled energy; Rahu alone gives unconventional gain. Together they produce sudden, untamed force — useful for athletes, surgeons, soldiers and entrepreneurs if channelled, dangerous if not.",
    whenPresent:
      "You carry a strong Mars-Rahu charge. Discipline that channel into competitive sport, surgery, military or entrepreneurship and it becomes a superpower; ignore it and it surfaces as accidents and outbursts.",
    whenAbsent:
      "Mars and Rahu are not in tight conjunction. The Angarak pattern is not active in your chart.",
    effects: [
      "Short fuse — outbursts that damage relationships.",
      "Accident-prone, especially with vehicles, fire, electricity, blades.",
      "Risk of legal trouble through impulsive action.",
      "Hyper-competitive drive — channelable into sport, military or entrepreneurship.",
      "Strong defensive instinct, surgical sharpness, leadership in chaos."
    ],
    remedies: [
      { title: "Hanuman worship on Tuesdays", detail: "Hanuman Chalisa + Sundarkand. He pacifies both Mars and Rahu." },
      { title: "Mangal Beej + Rahu Beej", detail: "Chant Mangal mantra and Rahu mantra (108 each) on Tuesdays for 48 days." },
      { title: "Donate red and grey items", detail: "Red masoor dal, jaggery, copper utensils, plus grey blankets to the poor on Tuesday." },
      { title: "Avoid alcohol & meat on Tuesdays", detail: "Light fasting, vegetarian food on Tuesdays cools the Angarak burn." },
      { title: "Drive carefully on Tuesdays", detail: "Mars-Rahu accident days statistically cluster on Tuesdays — extra caution." },
      { title: "Coral with Hessonite caution", detail: "Coral can be worn for Mars; Hessonite should not be paired without expert advice." }
    ],
    lucky: {
      color: "Red & Smoky Grey",
      day: "Tuesday",
      number: 9,
      gemstone: "Red Coral (Moonga)",
      metal: "Copper",
      direction: "South",
      deity: "Lord Hanuman",
      mantra: "Om Hum Hanumate Rudratmakaya Hum Phat"
    }
  },

  grahan: {
    key: "grahan",
    name: "Grahan Dosha",
    ruler: "Sun/Moon eclipsed by Rahu/Ketu",
    intro:
      "Grahan Dosha forms when the Sun or Moon is closely conjoined with Rahu or Ketu — the same astronomical configuration that produces a literal eclipse.",
    significance:
      "An eclipsed luminary loses light. If the Sun is eclipsed, vitality, ego and father suffer; if the Moon is eclipsed, mind, mother and emotional stability suffer. The dosha is moderate and responds well to consistent solar/lunar remedies.",
    whenPresent:
      "Your inner luminary is partially eclipsed. Energy levels and emotional stability swing; the remedy is daily strengthening of the eclipsed body — Sun salutations for Surya Grahan, Monday-fasting and milk for Chandra Grahan.",
    whenAbsent:
      "Sun and Moon are clear of tight Rahu/Ketu conjunction. The Grahan pattern is not active.",
    effects: [
      "Low vitality, frequent fatigue (Sun eclipsed).",
      "Mood swings, anxiety, sleep disturbance (Moon eclipsed).",
      "Strained relationship with father (Sun) or mother (Moon).",
      "Mental confusion during eclipse periods of the year.",
      "Strong intuitive and psychic capacity once channelled."
    ],
    remedies: [
      { title: "Surya Namaskar at sunrise", detail: "12 rounds daily, facing east — strengthens an eclipsed Sun powerfully." },
      { title: "Aditya Hridaya Stotra", detail: "Recite weekly on Sunday — the Ramayana hymn for solar power." },
      { title: "Monday fasting", detail: "Fast on Mondays till evening, break with milk-based food — strengthens an eclipsed Moon." },
      { title: "Offer water to Sun", detail: "Each morning offer water from a copper vessel facing the rising Sun, with red flowers." },
      { title: "Navagraha Pooja", detail: "Performed at any Navagraha temple — covers all nine planet imbalances." },
      { title: "Pearl or Ruby", detail: "Pearl for Moon, Ruby for Sun — chosen based on which luminary is afflicted." }
    ],
    lucky: {
      color: "White (for Moon) / Gold (for Sun)",
      day: "Sunday & Monday",
      number: 1,
      gemstone: "Pearl + Ruby",
      metal: "Silver + Gold",
      direction: "East / North-West",
      deity: "Surya & Chandra",
      mantra: "Om Surya Chandramasau Namah"
    }
  },

  vish_yoga: {
    key: "vish_yoga",
    name: "Vish Yoga",
    ruler: "Moon + Saturn",
    intro:
      "Vish Yoga — ‘poison combination’ — is the conjunction of Moon (mind, emotions) with Saturn (restriction, melancholy). The mind sits inside Saturn's cold cell.",
    significance:
      "Moon's natural function is to flow and feel; Saturn's natural function is to restrict and slow. Their conjunction produces a heavy, brooding, often pessimistic mind — but also depth, patience, and uncommon resilience under pressure.",
    whenPresent:
      "Emotional life runs heavy. You feel things slowly but deeply, find it hard to articulate moods, and may carry a quiet melancholy. The remedy is moonlight, water, and gentle daily Shiva worship.",
    whenAbsent:
      "Moon and Saturn are not closely conjoined in your chart. Vish Yoga is not active.",
    effects: [
      "Persistent low mood, especially in evenings or winter.",
      "Difficulty expressing emotions; feels older than peers.",
      "Sleep disturbance, dreams of dark or cold places.",
      "Strong endurance, calm under crisis, depth in writing/art.",
      "Strained relationship with mother."
    ],
    remedies: [
      { title: "Monday fasting", detail: "Fast and worship Shiva on Mondays — the classical Moon-strengthener." },
      { title: "Moonlight bathing", detail: "Sit in moonlight on full-moon nights; meditate facing the moon." },
      { title: "Chandra & Shani mantras", detail: "Chant ‘Om Som Somaya Namah’ and ‘Om Sham Shanaishcharaya Namah’ daily." },
      { title: "Donate milk / white items", detail: "Milk, rice, sugar, white cloth — donated to a temple or needy on Mondays." },
      { title: "Wear a Pearl", detail: "A natural Pearl in silver, on the small finger — strengthens the Moon side." },
      { title: "Maha Mrityunjaya at Pradosham", detail: "Recite during the Pradosham hour (1.5 hours before sunset) on the 13th tithi." }
    ],
    lucky: {
      color: "White & Silver",
      day: "Monday",
      number: 2,
      gemstone: "Pearl (Moti)",
      metal: "Silver",
      direction: "North-West",
      deity: "Lord Shiva",
      mantra: "Om Namah Shivaya"
    }
  },

  kemadruma: {
    key: "kemadruma",
    name: "Kemadruma Dosha",
    ruler: "Moon (isolated)",
    intro:
      "Kemadruma Dosha forms when the Moon has no planets in the houses immediately before and after it (2nd and 12th from Moon), and no planet conjoins it. The Moon stands alone in the sky of the chart.",
    significance:
      "Moon represents the mind and emotional support system. With no planetary neighbours, the mind feels unsupported — the native often experiences emotional isolation, even amid people. The dosha is cancelled by aspects from benefics, by dignified Moon, or by conjunction with Jupiter/Venus/Mercury.",
    whenPresent:
      "Your Moon is solitary. You may have felt emotionally on your own from childhood, even in supportive families. The dosha softens with companionship, devotion to a personal deity, and consistent Moon-strengthening practice.",
    whenAbsent:
      "Your Moon has supportive planets either alongside it or in the adjacent houses. Kemadruma is not active.",
    effects: [
      "Sense of being alone even in a crowd.",
      "Mood swings, emotional fatigue.",
      "Wealth comes and goes erratically until 30s.",
      "Slow progression in early life, sudden bloom later.",
      "Deep inner life, strong meditative capacity."
    ],
    remedies: [
      { title: "Worship the Moon on Mondays", detail: "Offer water, milk and white flowers to a Shiva-Linga every Monday morning." },
      { title: "White-food charity", detail: "Donate rice, milk, sugar, curd or white cloth on Mondays." },
      { title: "Chandra Beej Mantra", detail: "Chant ‘Om Shram Shreem Shraum Sah Chandraya Namah’ 108 times on Mondays." },
      { title: "Surround yourself with people", detail: "Cultivate community — chanting groups, satsang, regular family contact. Kemadruma weakens with companionship." },
      { title: "Pearl in silver", detail: "Wear a natural pearl in silver on the little finger of the right hand." },
      { title: "Krishna devotion", detail: "Bhagavad Gita reading and Krishna bhajans — Krishna is the cosmic friend deity." }
    ],
    lucky: {
      color: "White",
      day: "Monday",
      number: 2,
      gemstone: "Pearl (Moti)",
      metal: "Silver",
      direction: "North-West",
      deity: "Lord Krishna / Chandra",
      mantra: "Om Som Somaya Namah"
    }
  },

  paap_kartari: {
    key: "paap_kartari",
    name: "Paap Kartari Yoga",
    ruler: "Malefics flanking Lagna",
    intro:
      "Paap Kartari literally means ‘malefic scissors’. When malefic planets (Sun, Mars, Saturn, Rahu, Ketu) occupy both the 12th and 2nd houses from the ascendant (or any sensitive house), that house is hemmed and cut off from supportive flow.",
    significance:
      "The hemmed-in house struggles to express its natural significance. Lagna Paap Kartari constrains personality and growth; Moon Paap Kartari constrains emotional flow; 7th-house Paap Kartari constrains marriage.",
    whenPresent:
      "The Ascendant is currently scissored between malefic energies. Personal initiative meets walls; remedies focus on strengthening the Lagna lord and the Lagna sign's deity.",
    whenAbsent:
      "Ascendant is not flanked by malefics. Personality and initiative express freely.",
    effects: [
      "Confined sense of self; opportunities arrive but feel blocked.",
      "Health pressure on areas the Lagna lord rules.",
      "Difficulty asserting boundaries.",
      "Develops uncommon resilience and self-discipline.",
      "Late but lasting recognition once Lagna lord is strengthened."
    ],
    remedies: [
      { title: "Strengthen the Lagna lord", detail: "Identify the planet ruling your ascendant and follow its day, mantra and gem." },
      { title: "Ishta Devata mantra", detail: "Daily 108 repetitions of your personal deity's mantra anchors the self against malefic pressure." },
      { title: "Gayatri Mantra at sunrise", detail: "Universal protection mantra — 11 to 108 chants daily." },
      { title: "Navagraha temple visits", detail: "Visit on Saturdays; circumambulate the Navagraha shrine 9 times." },
      { title: "Wear protective Rudraksha", detail: "Five-mukhi Rudraksha mala — generic protection across all malefic afflictions." },
      { title: "Strengthen the Ascendant chakra", detail: "Sit in meditation focusing on the area the Lagna sign rules in the body, daily." }
    ],
    lucky: {
      color: "Depends on Lagna lord",
      day: "Day of the Lagna lord",
      number: 1,
      gemstone: "Gem of the Lagna lord",
      metal: "Metal of the Lagna lord",
      direction: "East",
      deity: "Personal Ishta Devata",
      mantra: "Om Bhur Bhuvah Svah Tat Savitur Varenyam…"
    }
  },

  shakat: {
    key: "shakat",
    name: "Shakat Dosha",
    ruler: "Moon-Jupiter relationship",
    intro:
      "Shakat — meaning ‘cart’ — Dosha forms when the Moon is placed in the 6th, 8th or 12th house from Jupiter. The fortunes of the chart move like a cart: rising and falling in cycles.",
    significance:
      "Jupiter is the planet of prosperity and grace; Moon is the mind. When the two sit in 6/8/12 from each other, abundance arrives but slips away just as it stabilises. The dosha is mild and naturally mitigates with maturity.",
    whenPresent:
      "Your fortune oscillates. Periods of growth alternate with periods of contraction. Build slowly, save consistently, and lean on Jupiter remedies — the cart steadies with age.",
    whenAbsent:
      "Moon is not in 6/8/12 from Jupiter. Fortune flows with normal continuity.",
    effects: [
      "Income rises then falls in cycles.",
      "Difficulty holding a steady position for long.",
      "Periodic separations from family for work.",
      "Rebuilding teaches resilience and improvisation.",
      "Late-life stability and respect."
    ],
    remedies: [
      { title: "Strengthen Jupiter", detail: "Daily Vishnu Sahasranama, Thursday fasting, yellow clothing." },
      { title: "Guru Mantra", detail: "Chant ‘Om Brim Brihaspataye Namah’ 108 times on Thursdays." },
      { title: "Donate yellow items", detail: "Yellow cloth, turmeric, gram dal, ghee — to Brahmins or temples on Thursdays." },
      { title: "Yellow Sapphire (after consultation)", detail: "Pukhraj of 3+ ratti, set in gold, on the right index finger on a Thursday morning." },
      { title: "Feed cows on Thursdays", detail: "Offer chickpeas and jaggery to a cow." },
      { title: "Banana tree worship", detail: "On Thursdays, water a banana tree and offer turmeric to its roots." }
    ],
    lucky: {
      color: "Yellow",
      day: "Thursday",
      number: 3,
      gemstone: "Yellow Sapphire (Pukhraj)",
      metal: "Gold",
      direction: "North-East",
      deity: "Lord Vishnu / Brihaspati",
      mantra: "Om Brim Brihaspataye Namah"
    }
  },

  gandmool: {
    key: "gandmool",
    name: "Gandmool Dosha",
    ruler: "Junctional nakshatras",
    intro:
      "Gandmool Dosha forms when the natal Moon falls in one of six junctional nakshatras — Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati — ruled by Ketu or Mercury at the joints between sign-groups.",
    significance:
      "Junctional birth is karmically charged. The native is unusually intense, often gifted, but the early years (especially the first 27 days, then early childhood) are sensitive. The classical remedy — Gandmool Shanti pooja on the same nakshatra return — clears the early obstacle.",
    whenPresent:
      "You were born under a Gandmool nakshatra. After Gandmool Shanti is performed (ideally 27 days after birth, but it can be done at any age), the dosha's edge softens and the gifted side emerges fully.",
    whenAbsent:
      "Your birth nakshatra is not a junctional one. Gandmool Dosha does not apply.",
    effects: [
      "Sensitive infancy and early childhood.",
      "Sharp, intense personality with strong likes and dislikes.",
      "Often unusually gifted in research, mysticism or technical skill.",
      "Possible early-life obstacle around father, finances or health.",
      "Once shanti is done — natural leadership and depth."
    ],
    remedies: [
      { title: "Gandmool Shanti pooja", detail: "Performed on the next return of the same nakshatra after birth — best at a temple or with a qualified astrologer." },
      { title: "Ruling planet's mantra", detail: "Chant Ketu mantra (Ashwini, Magha, Mula) or Mercury mantra (Ashlesha, Jyeshtha, Revati) 108 times daily." },
      { title: "Donate based on nakshatra", detail: "Black sesame and grey blanket for Ketu nakshatras; green moong dal and emerald-coloured cloth for Mercury nakshatras." },
      { title: "Wear nakshatra-aligned colour", detail: "Smoky grey for Ketu-ruled, green for Mercury-ruled — on the relevant day." },
      { title: "Ganesha worship", detail: "Daily Ganesha aarti — Ganesha is the universal obstacle-remover for all junction-related issues." },
      { title: "Subrahmanya temple visit", detail: "Visit Murugan / Subrahmanya temples — protective deity for Gandmool natives." }
    ],
    lucky: {
      color: "Smoky Grey or Emerald Green (depending on ruler)",
      day: "Wednesday or Saturday",
      number: 5,
      gemstone: "Cat's Eye (Ketu nakshatras) / Emerald (Mercury nakshatras)",
      metal: "Silver or Panchadhatu",
      direction: "South",
      deity: "Lord Ganesha & Subrahmanya",
      mantra: "Om Gan Ganapataye Namah"
    }
  },

  daridra: {
    key: "daridra",
    name: "Daridra Dosha",
    ruler: "11th lord in the 12th",
    intro:
      "Daridra — ‘poverty’ — Dosha forms when the lord of the 11th house (gains, income) is placed in the 12th house (loss, expenditure). Earned energy leaks straight into outflow.",
    significance:
      "Income is generated, but it never accumulates — it is absorbed by expenses, debts, distant travel, or charitable outflow. The dosha is mitigated by a strong 11th lord, by benefic aspects on the 12th, and by disciplined Lakshmi practice.",
    whenPresent:
      "You earn, but holding savings is hard. Income leaks via either over-generosity, foreign travel, medical expenses, or recurring family obligations. The remedy is structured wealth practice plus Lakshmi-Kuber worship.",
    whenAbsent:
      "11th lord is not placed in the 12th. Income flow accumulates as savings normally.",
    effects: [
      "Income arrives steadily but savings never grow.",
      "Recurring large expenses — medical, travel, family.",
      "Debt cycles even on good salary.",
      "Extreme generosity that can drain personal reserves.",
      "Gains through foreign sources, charity work or spiritual income channels."
    ],
    remedies: [
      { title: "Lakshmi worship on Fridays", detail: "Offer red flowers and kheer to Goddess Lakshmi every Friday evening, light a ghee lamp." },
      { title: "Kuber Mantra", detail: "Chant ‘Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadi Padayeh, Dhana Dhanya Samrudhim Me Dehi Dapaya Swaha’ daily." },
      { title: "Sri Suktam", detail: "Recite the Sri Suktam on Fridays, full-moons (Purnima) and Diwali." },
      { title: "Donate on Purnima", detail: "Donate food, money or clothes on every full-moon — paradoxically, charity unblocks Daridra." },
      { title: "Maintain a Lakshmi corner", detail: "Northeast corner of the home, with a Lakshmi-Kuber yantra and a small lit lamp every dusk." },
      { title: "Avoid Friday evening loans", detail: "Don't lend money on Friday evenings; don't bring in dirty/torn currency." }
    ],
    lucky: {
      color: "Pink & Cream",
      day: "Friday",
      number: 6,
      gemstone: "Diamond or White Sapphire",
      metal: "Silver or Platinum",
      direction: "North (Kuber direction)",
      deity: "Goddess Lakshmi & Lord Kuber",
      mantra: "Om Shreem Mahalakshmiyei Namah"
    }
  }
};

export function getDoshaDetail(key) {
  return DOSHA_DETAILS[key];
}
