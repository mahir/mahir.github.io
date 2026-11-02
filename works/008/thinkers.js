// The thinkers and the lines between them.
// A person stands where they were about thirty (`at` overrides it); a school or a source stands at its own year.
// x is a hint from 0 to 1600, across the sheet: Chinese and Japanese thought on the far left, Indian beside it,
// then the Greek and European line, with what became continental philosophy left of center and analytic right.
// Edges are `from>to` for a direct influence and `from~to` for one that is indirect or disputed,
// with a few words on what passed between them.
window.Thinkers = (() => {
  'use strict';

  // [id, name, born, died, place, x, idea, extra]
  const people = [
    // Greece
    ['thales', 'Thales', -624, -546, 'Miletus', 830, 'Everything is water; the first to explain nature without the gods.', { c: 1 }],
    ['anaximander', 'Anaximander', -610, -546, 'Miletus', 680, 'All things come from the boundless, the apeiron, and return to it.', { c: 1 }],
    ['anaximenes', 'Anaximenes', -586, -526, 'Miletus', 560, 'Air, thinned and thickened, becomes everything there is.', { c: 1 }],
    ['pythagoras', 'Pythagoras', -570, -495, 'Samos, Croton', 1150, 'The world is ordered by number; the soul migrates from body to body.', { c: 1 }],
    ['xenophanes', 'Xenophanes', -570, -475, 'Colophon', 960, 'If oxen had hands, they would draw their gods as oxen.', { c: 1 }],
    ['heraclitus', 'Heraclitus', -535, -475, 'Ephesus', 560, 'Everything flows; the unity of opposites is held by the logos.', { c: 1 }],
    ['parmenides', 'Parmenides', -515, -450, 'Elea', 920, 'What is, is, and cannot not be; change is an illusion of the senses.', { c: 1 }],
    ['anaxagoras', 'Anaxagoras', -500, -428, 'Clazomenae, Athens', 700, 'Mind, nous, set the mixture of the world in motion.', { c: 1 }],
    ['zeno', 'Zeno of Elea', -490, -430, 'Elea', 1060, 'Paradoxes of motion: Achilles never catches the tortoise.', { c: 1 }],
    ['empedocles', 'Empedocles', -494, -434, 'Acragas', 1300, 'Four roots, earth, water, air and fire, moved by Love and Strife.', { c: 1 }],
    ['protagoras', 'Protagoras', -490, -420, 'Abdera, Athens', 1460, 'Man is the measure of all things.', { c: 1 }],
    ['leucippus', 'Leucippus', -480, -420, 'Miletus, Abdera', 1250, 'The world is atoms and the void.', { c: 1, when: '5th c. BCE' }],
    ['socrates', 'Socrates', -470, -399, 'Athens', 760, 'The unexamined life is not worth living; he wrote nothing and asked everything.', { c: 1 }],
    ['democritus', 'Democritus', -460, -370, 'Abdera', 1280, 'Sweet and bitter are by convention; in reality there are atoms and the void.', { c: 1 }],
    ['plato', 'Plato', -428, -348, 'Athens', 880, 'Behind the shifting world stand eternal Forms; the philosopher climbs out of the cave.', { c: 1 }],
    ['diogenes', 'Diogenes', -412, -323, 'Sinope, Athens', 580, 'The Cynic: live by nature, without shame or possessions.', { c: 1 }],
    ['aristotle', 'Aristotle', -384, -322, 'Stagira, Athens', 1030, 'Logic, causes, virtue as a mean: knowledge sorted into the sciences.'],
    ['pyrrho', 'Pyrrho', -360, -270, 'Elis', 1300, 'Suspend judgment, and peace of mind follows.', { c: 1 }],
    ['epicurus', 'Epicurus', -341, -270, 'Samos, Athens', 1160, 'Pleasure, understood as the absence of pain and fear, is the good.'],
    // China and India, early
    ['confucius', 'Confucius', -551, -479, 'Lu', 210, 'Order the self and the family, and the state will follow; ritual and humaneness, ren.'],
    ['laozi', 'Laozi', -571, -471, 'Zhou', 80, 'The Dao that can be named is not the eternal Dao.', { when: '6th–4th c. BCE', at: -500 }],
    ['buddha', 'The Buddha', -480, -400, 'Magadha', 330, 'Suffering, its cause, its end and the path to it; no fixed self.', { when: '5th c. BCE', short: 'Buddha' }],
    ['mozi', 'Mozi', -470, -391, 'Lu', 250, 'Impartial care for all, against Confucian partiality and waste.', { c: 1 }],
    ['mencius', 'Mencius', -372, -289, 'Zou', 230, 'Human nature is good; it grows like a sprout if tended.', { c: 1 }],
    ['zhuangzi', 'Zhuangzi', -369, -286, 'Song', 80, 'Dreaming he was a butterfly, or a butterfly dreaming it was Zhuangzi.', { c: 1 }],
    ['xunzi', 'Xunzi', -310, -235, 'Zhao, Qi', 200, 'Human nature is bad; goodness is made by ritual and learning.', { c: 1 }],
    ['hanfei', 'Han Feizi', -280, -233, 'Han', 300, 'Legalism: rule by law, reward and punishment, not virtue.', { c: 1 }],
    // Rome
    ['cicero', 'Cicero', -106, -43, 'Rome', 780, 'Greek philosophy put into Latin; natural law and the republic.'],
    ['lucretius', 'Lucretius', -99, -55, 'Rome', 1160, 'On the Nature of Things: Epicurus in verse, atoms and no fear of death.', { c: 1 }],
    ['seneca', 'Seneca', -4, 65, 'Rome', 640, 'Stoic letters on time, anger and how to die well.', { c: 1 }],
    ['epictetus', 'Epictetus', 50, 135, 'Hierapolis, Nicopolis', 540, 'Some things are up to us and some are not; a freed slave teaching freedom.', { c: 1 }],
    ['marcus', 'Marcus Aurelius', 121, 180, 'Rome', 720, 'Meditations: an emperor reminding himself to be good.'],
    ['sextus', 'Sextus Empiricus', 160, 210, 'Alexandria, Rome', 1260, 'Outlines of Pyrrhonism: for every argument, an equal and opposite one.', { c: 1 }],
    ['nagarjuna', 'Nagarjuna', 150, 250, 'Andhra', 330, 'Madhyamaka: all things are empty of inherent existence, emptiness included.', { c: 1 }],
    ['plotinus', 'Plotinus', 204, 270, 'Lycopolis, Rome', 920, 'All flows from the One; the soul can return to it.'],
    ['augustine', 'Augustine', 354, 430, 'Thagaste, Hippo', 800, 'Confessions and the City of God: Plato baptized, time as a stretching of the mind.'],
    ['boethius', 'Boethius', 477, 524, 'Rome, Pavia', 980, 'The Consolation of Philosophy, written awaiting execution.', { c: 1 }],
    ['shankara', 'Shankara', 700, 750, 'Kaladi, Kashi', 330, 'Advaita Vedanta: the self and Brahman are one; the world of many things is appearance.', { c: 1, when: '8th c.' }],
    // Islamic, Jewish and Latin philosophy
    ['alkindi', 'al-Kindi', 801, 873, 'Basra, Baghdad', 1080, 'The philosopher of the Arabs: Greek reason in the service of Islam.', { c: 1 }],
    ['alfarabi', 'al-Farabi', 872, 950, 'Baghdad, Damascus', 1250, 'The Second Teacher, after Aristotle; the virtuous city after Plato.', { c: 1 }],
    ['avicenna', 'Avicenna', 980, 1037, 'Bukhara, Isfahan', 1100, 'Ibn Sina: essence and existence distinct; the floating man knows he exists.'],
    ['ramanuja', 'Ramanuja', 1017, 1137, 'Sriperumbudur, Srirangam', 340, 'Qualified non-dualism: the world and souls are real, the body of God.', { c: 1 }],
    ['anselm', 'Anselm', 1033, 1109, 'Aosta, Canterbury', 780, 'God is that than which nothing greater can be conceived.'],
    ['alghazali', 'al-Ghazali', 1058, 1111, 'Tus, Baghdad', 1330, 'The Incoherence of the Philosophers: no necessary link between cause and effect.'],
    ['abelard', 'Abelard', 1079, 1142, 'Paris', 620, 'Universals are names and concepts; intention makes an act good or bad.'],
    ['averroes', 'Averroes', 1126, 1198, 'Córdoba, Marrakesh', 1180, 'Ibn Rushd, the Commentator: Aristotle restored, reason and faith both true.'],
    ['zhuxi', 'Zhu Xi', 1130, 1200, 'Fujian', 190, 'Neo-Confucianism: principle, li, in all things, to be grasped by study.'],
    ['maimonides', 'Maimonides', 1138, 1204, 'Córdoba, Cairo', 1420, 'The Guide for the Perplexed: Torah and Aristotle reconciled.'],
    ['dogen', 'Dōgen', 1200, 1253, 'Kyoto, Eiheiji', 90, 'Just sitting: practice is enlightenment; being is time.'],
    ['aquinas', 'Thomas Aquinas', 1225, 1274, 'Naples, Paris', 920, 'Summa Theologiae: Aristotle and the Church joined; five ways to God.', { short: 'Aquinas' }],
    ['scotus', 'Duns Scotus', 1266, 1308, 'Oxford, Paris', 1080, 'Being is said of God and creatures in one sense; thisness, haecceity.'],
    ['ockham', 'William of Ockham', 1287, 1347, 'Oxford, Munich', 760, 'Do not multiply entities beyond necessity; only individuals exist.', { c: 1, short: 'Ockham' }],
    ['wangyangming', 'Wang Yangming', 1472, 1529, 'Zhejiang', 200, 'Knowing and acting are one; the mind is principle.'],
    // Early modern Europe
    ['machiavelli', 'Machiavelli', 1469, 1527, 'Florence', 520, 'The Prince: politics as it is done, not as it ought to be.'],
    ['montaigne', 'Montaigne', 1533, 1592, 'Bordeaux', 680, 'Essays: what do I know? The self as a subject of study.'],
    ['bacon', 'Francis Bacon', 1561, 1626, 'London', 1180, 'Knowledge is power; science by induction from experiment.', { short: 'Bacon' }],
    ['hobbes', 'Hobbes', 1588, 1679, 'Malmesbury, London', 1000, 'Leviathan: without a sovereign, life is solitary, poor, nasty, brutish and short.'],
    ['descartes', 'Descartes', 1596, 1650, 'La Haye, Holland', 760, 'I think, therefore I am; mind and body are two substances.'],
    ['pascal', 'Pascal', 1623, 1662, 'Clermont, Paris', 560, 'The heart has its reasons which reason does not know; the wager.'],
    ['spinoza', 'Spinoza', 1632, 1677, 'Amsterdam, The Hague', 850, 'God or Nature: one substance, and freedom as understanding necessity.'],
    ['locke', 'Locke', 1632, 1704, 'Wrington, London', 1180, 'The mind begins as a blank slate; government by consent, to protect life, liberty and property.'],
    ['leibniz', 'Leibniz', 1646, 1716, 'Leipzig, Hanover', 640, 'Monads, pre-established harmony, and the best of all possible worlds.'],
    ['berkeley', 'Berkeley', 1685, 1753, 'Kilkenny, Cloyne', 1300, 'To be is to be perceived.'],
    ['voltaire', 'Voltaire', 1694, 1778, 'Paris, Ferney', 1020, 'Candide: tolerance, wit and war on superstition.'],
    ['hume', 'Hume', 1711, 1776, 'Edinburgh', 1250, 'Reason is the slave of the passions; causation is only habit.'],
    ['rousseau', 'Rousseau', 1712, 1778, 'Geneva, Paris', 880, 'Man is born free, and everywhere he is in chains; the general will.'],
    ['smith', 'Adam Smith', 1723, 1790, 'Kirkcaldy, Glasgow', 1440, 'Moral sentiments and the wealth of nations; sympathy and the invisible hand.'],
    ['kant', 'Kant', 1724, 1804, 'Königsberg', 1040, 'We know the world only as our minds shape it; act only on a maxim you could will as law.'],
    ['bentham', 'Bentham', 1748, 1832, 'London', 1370, 'The greatest happiness of the greatest number.'],
    ['wollstonecraft', 'Wollstonecraft', 1759, 1797, 'London', 1150, 'A Vindication of the Rights of Woman: reason has no sex.'],
    ['fichte', 'Fichte', 1762, 1814, 'Jena, Berlin', 820, 'The I posits itself and the world against it.'],
    ['hegel', 'Hegel', 1770, 1831, 'Stuttgart, Jena, Berlin', 700, 'Spirit comes to know itself through history; the real is rational.', { at: 1806 }],
    ['schelling', 'Schelling', 1775, 1854, 'Jena, Munich', 900, 'Nature is visible spirit, and spirit invisible nature.', { at: 1798 }],
    ['schopenhauer', 'Schopenhauer', 1788, 1860, 'Danzig, Frankfurt', 1020, 'The world is will and representation; art and compassion quiet the will.'],
    ['comte', 'Comte', 1798, 1857, 'Montpellier, Paris', 1450, 'Positivism: knowledge advances from theology to metaphysics to science.'],
    ['emerson', 'Emerson', 1803, 1882, 'Concord', 1530, 'Self-Reliance: trust thyself; the Over-Soul in every person.'],
    ['feuerbach', 'Feuerbach', 1804, 1872, 'Landshut, Nuremberg', 580, 'God is humanity\'s own nature projected outward.'],
    ['mill', 'John Stuart Mill', 1806, 1873, 'London', 1340, 'On Liberty: the only purpose of power over another is to prevent harm.', { short: 'J. S. Mill' }],
    ['kierkegaard', 'Kierkegaard', 1813, 1855, 'Copenhagen', 820, 'Truth is subjectivity; faith is a leap.'],
    ['thoreau', 'Thoreau', 1817, 1862, 'Concord', 1520, 'Walden and Civil Disobedience: live deliberately, refuse unjust law.'],
    ['marx', 'Marx', 1818, 1883, 'Trier, Paris, London', 560, 'Philosophers have only interpreted the world; the point is to change it.'],
    ['dilthey', 'Dilthey', 1833, 1911, 'Berlin', 660, 'The human sciences understand from within; nature is explained from without.'],
    ['brentano', 'Brentano', 1838, 1917, 'Vienna', 1000, 'Every mental act is directed at something: intentionality.'],
    ['peirce', 'Peirce', 1839, 1914, 'Cambridge, Mass.', 1480, 'Pragmatism: a concept means its practical effects; signs all the way down.'],
    ['james', 'William James', 1842, 1910, 'Cambridge, Mass.', 1380, 'Truth is what works; the stream of consciousness.', { short: 'James' }],
    ['nietzsche', 'Nietzsche', 1844, 1900, 'Röcken, Basel, Sils', 780, 'God is dead; become who you are; the eternal return.'],
    ['frege', 'Frege', 1848, 1925, 'Jena', 1200, 'Modern logic, and the difference between sense and reference.'],
    ['bergson', 'Bergson', 1859, 1941, 'Paris', 940, 'Lived time, durée, is not clock time; the élan vital.'],
    ['husserl', 'Husserl', 1859, 1938, 'Göttingen, Freiburg', 1050, 'Phenomenology: back to the things themselves, as they appear.'],
    ['dewey', 'Dewey', 1859, 1952, 'Chicago, New York', 1500, 'Thinking is an instrument for solving problems; education is democracy in practice.'],
    ['whitehead', 'Whitehead', 1861, 1947, 'Cambridge, Harvard', 1370, 'Reality is process, not substance; philosophy is footnotes to Plato.', { at: 1905 }],
    ['vivekananda', 'Vivekananda', 1863, 1902, 'Calcutta, Chicago', 380, 'Vedanta for the modern world; every soul is potentially divine.'],
    ['gandhi', 'Gandhi', 1869, 1948, 'Porbandar, Ahmedabad', 300, 'Satyagraha: truth-force and non-violence against injustice.'],
    ['nishida', 'Nishida Kitarō', 1870, 1945, 'Kyoto', 130, 'Pure experience before subject and object; the logic of place.', { short: 'Nishida' }],
    ['russell', 'Bertrand Russell', 1872, 1970, 'Cambridge, London', 1260, 'Mathematics reduced to logic; the analysis of language and knowledge.', { short: 'Russell' }],
    ['lukacs', 'Lukács', 1885, 1971, 'Budapest', 560, 'History and Class Consciousness: reification and the standpoint of the proletariat.'],
    ['wittgenstein', 'Wittgenstein', 1889, 1951, 'Vienna, Cambridge', 1140, 'The limits of my language are the limits of my world; later, meaning is use.'],
    ['heidegger', 'Heidegger', 1889, 1976, 'Freiburg', 860, 'Being and Time: we are thrown into a world, being-towards-death.'],
    ['ambedkar', 'Ambedkar', 1891, 1956, 'Bombay, Delhi', 400, 'Annihilation of Caste; the Buddha and his Dhamma; author of India\'s constitution.'],
    ['hushih', 'Hu Shih', 1891, 1962, 'Beijing', 230, 'Pragmatism and the vernacular for a new China.'],
    ['carnap', 'Carnap', 1891, 1970, 'Vienna, Chicago', 1330, 'The logical construction of the world; metaphysics as nonsense.'],
    ['benjamin', 'Walter Benjamin', 1892, 1940, 'Berlin, Paris', 470, 'The work of art in the age of mechanical reproduction; the angel of history.', { short: 'Benjamin' }],
    ['marcuse', 'Marcuse', 1898, 1979, 'Frankfurt, San Diego', 650, 'One-Dimensional Man: affluence as a quieter domination.'],
    ['gadamer', 'Gadamer', 1900, 2002, 'Heidelberg', 940, 'Truth and Method: understanding is a fusion of horizons.'],
    ['nishitani', 'Nishitani Keiji', 1900, 1990, 'Kyoto', 120, 'Religion and Nothingness: through nihilism to emptiness.', { short: 'Nishitani' }],
    ['lacan', 'Lacan', 1901, 1981, 'Paris', 380, 'The unconscious is structured like a language; the mirror stage.'],
    ['kojeve', 'Kojève', 1902, 1968, 'Paris', 700, 'Lectures on Hegel, 1933 to 1939: master and slave, and the end of history.', { at: 1926 }],
    ['popper', 'Popper', 1902, 1994, 'Vienna, London', 1430, 'Science advances by bold conjectures and refutations; the open society.'],
    ['adorno', 'Adorno', 1903, 1969, 'Frankfurt', 560, 'Dialectic of Enlightenment: reason turned into domination; the culture industry.'],
    ['sartre', 'Sartre', 1905, 1980, 'Paris', 800, 'Existence precedes essence; we are condemned to be free.'],
    ['arendt', 'Hannah Arendt', 1906, 1975, 'Königsberg, New York', 1000, 'The banality of evil; action, plurality and the public realm.', { short: 'Arendt' }],
    ['levinas', 'Levinas', 1906, 1995, 'Kaunas, Paris', 1100, 'Ethics as first philosophy: the face of the other commands.'],
    ['quine', 'Quine', 1908, 2000, 'Harvard', 1340, 'No line between analytic and synthetic; knowledge is a web.'],
    ['beauvoir', 'Simone de Beauvoir', 1908, 1986, 'Paris', 620, 'One is not born, but rather becomes, a woman.', { short: 'Beauvoir' }],
    ['merleaupont', 'Merleau-Ponty', 1908, 1961, 'Paris', 920, 'The body is our way of having a world.'],
    ['levistrauss', 'Lévi-Strauss', 1908, 2009, 'Paris', 300, 'Structural anthropology: myths think themselves in people.'],
    ['weil', 'Simone Weil', 1909, 1943, 'Paris, London', 1040, 'Attention is the rarest and purest form of generosity.', { short: 'Weil' }],
    ['austin', 'J. L. Austin', 1911, 1960, 'Oxford', 1450, 'How to Do Things with Words: to say is sometimes to do.', { short: 'Austin' }],
    ['camus', 'Camus', 1913, 1960, 'Algiers, Paris', 860, 'The absurd; one must imagine Sisyphus happy.'],
    ['anscombe', 'Elizabeth Anscombe', 1919, 2001, 'Cambridge, Oxford', 1150, 'Intention; modern moral philosophy without a lawgiver makes no sense.', { short: 'Anscombe' }],
    ['murdoch', 'Iris Murdoch', 1919, 1999, 'Oxford', 980, 'The Sovereignty of Good: moral life is a matter of attention.', { short: 'Murdoch' }],
    ['rawls', 'Rawls', 1921, 2002, 'Harvard', 1310, 'A Theory of Justice: principles chosen behind a veil of ignorance.'],
    ['kuhn', 'Kuhn', 1922, 1996, 'Harvard, MIT', 1500, 'The Structure of Scientific Revolutions: paradigms and their shifts.'],
    ['deleuze', 'Deleuze', 1925, 1995, 'Paris', 760, 'Difference before identity; the rhizome, not the tree.'],
    ['fanon', 'Fanon', 1925, 1961, 'Martinique, Algeria', 460, 'Black Skin, White Masks; The Wretched of the Earth.'],
    ['putnam', 'Putnam', 1926, 2016, 'Harvard', 1450, 'Meanings ain\'t in the head; the mind as functional organization.'],
    ['foucault', 'Foucault', 1926, 1984, 'Paris', 620, 'Power produces knowledge; the history of madness, prisons and sexuality.'],
    ['habermas', 'Habermas', 1929, null, 'Frankfurt', 560, 'Communicative reason and the public sphere.'],
    ['derrida', 'Derrida', 1930, 2004, 'Paris', 880, 'Deconstruction: there is nothing outside the text.'],
    ['rorty', 'Rorty', 1931, 2007, 'Princeton, Virginia, Stanford', 1520, 'Philosophy and the Mirror of Nature: give up on representing reality.'],
    ['nozick', 'Nozick', 1938, 2002, 'Harvard', 1230, 'Anarchy, State, and Utopia: the minimal state and the experience machine.'],
    ['kripke', 'Kripke', 1940, 2022, 'Princeton, New York', 1340, 'Naming and Necessity: names are rigid designators.'],
    ['dennett', 'Dennett', 1942, 2024, 'Tufts', 1460, 'Consciousness explained as many drafts; Darwin\'s dangerous idea.'],
    ['singer', 'Peter Singer', 1946, null, 'Oxford, Princeton', 1180, 'Animal Liberation; the drowning child and effective altruism.', { short: 'Singer' }],
    ['butler', 'Judith Butler', 1956, null, 'Berkeley', 720, 'Gender Trouble: gender is performative, done rather than had.', { short: 'Butler' }],
  ];

  // [id, name, year, place or note, x, idea, extra]; `at` overrides where it stands
  const schools = [
    ['stoicism', 'STOICISM', -300, 'Athens', 620, 'Founded by Zeno of Citium in the Painted Stoa: live by nature and reason, master what is in your power, accept what is not.', { at: -280, who: 'Zeno of Citium' }],
    ['chan', 'CHAN BUDDHISM', 600, 'China', 210, 'Meditation before scripture: sudden awakening to one\'s own nature. Called Zen in Japan.', { when: 'c. 600', who: 'Huineng' }],
    ['frankfurt', 'FRANKFURT SCHOOL', 1923, 'Frankfurt', 520, 'The Institute for Social Research: critical theory joining Marx, Hegel and Freud against domination.', { at: 1944 }],
    ['vienna', 'VIENNA CIRCLE', 1924, 'Vienna', 1260, 'Logical positivism: a statement means only what could verify it; metaphysics is nonsense.', { at: 1929 }],
    ['existentialism', 'EXISTENTIALISM', 1945, 'Paris', 760, 'Existence precedes essence: no given nature, only choices and the anguish of freedom.', { at: 1949 }],
    ['structuralism', 'STRUCTURALISM', 1949, 'Paris', 330, 'Meaning comes from the differences within a system, in language, myth and kinship.', { at: 1951 }],
    ['ordinary', 'ORDINARY LANGUAGE\nPHILOSOPHY', 1945, 'Oxford', 1360, 'Philosophical puzzles dissolve when we look at how words are actually used.', { at: 1960 }],
    ['poststruct', 'POST-STRUCTURALISM', 1966, 'Paris, Baltimore', 680, 'Structures are unstable: meaning, the subject and power all come apart and are made.', { at: 1980 }],
  ];

  // [id, label, year, x, note, extra]; sources from outside philosophy, standing at their year or `at`
  const sources = [
    ['mathx', 'BABYLONIAN AND\nEGYPTIAN MATHEMATICS', -680, 1080, 'The geometry and astronomy that, by later Greek accounts, Thales and Pythagoras learned in Egypt and the East.'],
    ['upanishads', 'THE UPANISHADS\nAND THE GITA', -700, 360, 'Sanskrit scripture on the self, atman, and ultimate reality, Brahman, composed from about 800 BCE; the Bhagavad Gita a few centuries later.'],
    ['euclid', 'EUCLID\'S ELEMENTS', -300, 1440, 'Geometry built from axioms and proofs, around 300 BCE in Alexandria.'],
    ['livy', 'LIVY\'S HISTORY\nOF ROME', -20, 420, 'The history of the Roman republic, written under Augustus.'],
    ['scripture', 'HEBREW AND\nCHRISTIAN SCRIPTURE', 60, 1040, 'The Hebrew Bible and the New Testament.'],
    ['arabic', 'GREEK TEXTS\nIN ARABIC', 790, 1300, 'Baghdad\'s translation movement, eighth to tenth centuries, put Aristotle, Plato, Euclid and Galen into Arabic.'],
    ['galileo', 'GALILEO AND\nTHE NEW SCIENCE', 1610, 1400, 'Mechanics, the telescope and a book of nature written in mathematics.'],
    ['newton', 'NEWTON\'S PRINCIPIA', 1687, 1400, 'Universal gravitation and the laws of motion, 1687.'],
    ['revolution', 'THE FRENCH\nREVOLUTION', 1789, 560, 'Liberty, equality, fraternity, and the Terror, from 1789.', { at: 1776 }],
    ['darwin', 'DARWIN\'S ORIGIN\nOF SPECIES', 1859, 1260, 'Evolution by natural selection, 1859.'],
    ['freud', 'FREUD\'S\nPSYCHOANALYSIS', 1900, 420, 'The unconscious, dreams and drives, from The Interpretation of Dreams, 1900.'],
    ['einstein', 'EINSTEIN\'S\nRELATIVITY', 1905, 1530, 'Special relativity in 1905, general relativity in 1915, confirmed by the eclipse of 1919.', { at: 1898 }],
    ['saussure', 'SAUSSURE\'S\nLINGUISTICS', 1916, 260, 'Course in General Linguistics, 1916: the sign is arbitrary, and meaning lives in differences.'],
    ['turing', 'TURING\'S\nMACHINES', 1936, 1540, 'On Computable Numbers, 1936, and Computing Machinery and Intelligence, 1950.'],
    ['war', 'TOTALITARIANISM\nAND THE WAR', 1939, 760, 'Stalin, Hitler, the Second World War and the Holocaust, 1933 to 1945.', { at: 1926, when: '1933–45' }],
  ];

  const ends = [
    ['continental', 'CONTINENTAL PHILOSOPHY', 2006, 620],
    ['analytic', 'ANALYTIC PHILOSOPHY', 2006, 1300],
  ];

  const lines = `
    mathx>thales Egyptian geometry, by tradition
    mathx~pythagoras number and harmony, by tradition
    thales>anaximander his student
    anaximander>anaximenes his student
    anaximander~heraclitus the strife of opposites
    thales~pythagoras by tradition, his first teacher
    xenophanes~parmenides one unchanging god, one unchanging being
    parmenides>zeno his student; paradoxes in his defense
    parmenides>empedocles nothing comes from nothing
    pythagoras>empedocles the transmigration of souls
    parmenides>leucippus an answer to the Eleatics
    zeno>leucippus infinite divisibility, refused
    anaximenes~anaxagoras the Ionian line
    leucippus>democritus his teacher
    anaxagoras>socrates read his book on Mind, and was disappointed
    socrates>plato his teacher
    socrates>diogenes by way of Antisthenes
    parmenides>plato being that does not change
    pythagoras>plato number, the soul, the Forms
    heraclitus>plato everything flows, through Cratylus
    protagoras>plato man the measure, refuted in the Theaetetus
    plato>aristotle twenty years in the Academy
    democritus>epicurus atoms and the void
    democritus~pyrrho through his teacher Anaxarchus
    buddha~pyrrho India's naked sages, met with Alexander; disputed
    diogenes>stoicism Zeno studied with the Cynic Crates
    heraclitus>stoicism logos and fire
    socrates>stoicism virtue is the only good
    confucius>mencius the Way of Confucius, defended
    confucius>xunzi the Way of Confucius, refounded
    confucius>mozi against ritual and partiality
    mencius>xunzi human nature is not good
    laozi>zhuangzi the Dao
    xunzi>hanfei his teacher
    upanishads~buddha the Brahmanical world he answered
    epicurus>lucretius his master, in verse
    plato>cicero the Academy's skepticism
    stoicism>cicero duties and natural law
    stoicism>seneca
    stoicism>epictetus
    epictetus>marcus the Discourses, his favorite reading
    pyrrho>sextus the skeptic tradition, written down
    buddha>nagarjuna the middle way
    plato>plotinus the One and the Good
    plotinus>augustine the books of the Platonists
    cicero>augustine the Hortensius turned him to philosophy
    scripture>augustine take up and read
    plato>boethius philosophy as consolation
    aristotle>boethius translated his logic
    stoicism~boethius fortune's wheel
    nagarjuna>chan emptiness
    zhuangzi~chan Daoist words for Buddhist ideas
    upanishads>shankara his commentaries
    nagarjuna~shankara called a hidden Buddhist by his rivals
    arabic>alkindi
    aristotle>alkindi
    plotinus~alkindi the Theology of Aristotle, really Plotinus
    arabic>alfarabi
    aristotle>alfarabi the Second Teacher, after the First
    plato>alfarabi the virtuous city
    alfarabi>avicenna read Aristotle's Metaphysics forty times, then al-Farabi made it clear
    aristotle>avicenna
    shankara>ramanuja against pure non-dualism
    augustine>anselm faith seeking understanding
    avicenna>alghazali The Incoherence of the Philosophers
    boethius>abelard logic and universals
    alghazali>averroes The Incoherence of the Incoherence
    aristotle>averroes the great commentaries
    alfarabi>maimonides the only logician he recommended
    aristotle>maimonides
    scripture>maimonides
    mencius>zhuxi the Four Books
    chan~zhuxi a metaphysics absorbed and opposed
    chan>dogen carried to Japan
    aristotle>aquinas the Philosopher
    augustine>aquinas
    averroes>aquinas the Commentator, and his errors
    avicenna>aquinas essence and existence
    maimonides>aquinas Rabbi Moses
    avicenna>scotus univocity of being
    aquinas>scotus
    scotus>ockham
    aristotle~ockham
    zhuxi>wangyangming against investigating things
    mencius>wangyangming innate knowing
    chan~wangyangming
    livy>machiavelli the Discourses on Livy
    cicero~machiavelli the republic
    sextus>montaigne printed in Latin in 1562
    seneca>montaigne
    lucretius~montaigne his annotated copy survives
    aristotle>bacon a New Organon to replace his
    galileo>hobbes visited Galileo in 1636
    euclid>hobbes fell in love with geometry at forty
    bacon~hobbes his secretary
    galileo>descartes Le Monde shelved after Galileo's trial
    montaigne>descartes doubt
    augustine~descartes the cogito, anticipated
    anselm>descartes the ontological argument
    avicenna~descartes the floating man; disputed
    montaigne>pascal
    descartes>pascal
    augustine>pascal grace
    descartes>spinoza
    euclid>spinoza the Ethics in geometric order
    maimonides>spinoza the Guide, read and refused
    hobbes>spinoza
    stoicism~spinoza
    descartes>locke
    bacon~locke
    hobbes~locke the state of nature
    descartes>leibniz
    spinoza>leibniz visited him in 1676
    hobbes~leibniz
    locke>berkeley
    locke>voltaire Letters on the English
    newton>voltaire brought Newton to France
    locke>hume
    berkeley>hume
    newton>hume the experimental method, for morals
    hobbes>rousseau the state of nature, redrawn
    locke>rousseau
    montaigne~rousseau
    machiavelli~rousseau the Prince as a book for republicans
    hume>smith friend and teacher
    hume>kant interrupted my dogmatic slumber
    leibniz>kant by way of Wolff
    rousseau>kant his portrait the only picture in the house
    newton>kant
    hume>bentham
    epicurus~bentham pleasure and pain
    rousseau>wollstonecraft Émile, answered
    locke>wollstonecraft
    revolution>wollstonecraft A Vindication of the Rights of Men
    kant>fichte
    spinoza~fichte
    kant>hegel
    fichte>hegel
    schelling>hegel his friend from the seminary
    spinoza>hegel
    aristotle~hegel
    heraclitus~hegel not one proposition of his I have not adopted
    revolution>hegel freedom made real; he toasted it every Bastille Day
    fichte>schelling
    kant>schelling
    spinoza>schelling
    kant>schopenhauer
    plato>schopenhauer
    upanishads>schopenhauer the consolation of my life
    buddha~schopenhauer
    upanishads>emerson Brahma, in verse
    plato~emerson
    kant~emerson through Coleridge
    hegel>feuerbach
    bentham>mill his father's friend, his tutor
    comte>mill
    hegel>kierkegaard against the System
    socrates>kierkegaard his thesis on irony
    schelling~kierkegaard heard him lecture in Berlin, 1841
    scripture>kierkegaard Abraham and Isaac
    emerson>thoreau
    upanishads>thoreau the Gita at Walden
    hegel>marx the dialectic, turned right side up
    feuerbach>marx
    smith>marx political economy
    epicurus~marx his doctoral thesis
    hegel>dilthey
    kant>dilthey a critique of historical reason
    aristotle>brentano intentionality, from the schoolmen
    aquinas~brentano
    kant>peirce
    scotus>peirce scholastic realism
    darwin>peirce
    peirce>james
    darwin>james
    emerson~james his godfather
    schopenhauer>nietzsche found in a Leipzig bookshop
    emerson>nietzsche
    heraclitus>nietzsche
    spinoza~nietzsche I have a precursor
    darwin~nietzsche
    montaigne~nietzsche
    kant~frege
    leibniz>frege a language of pure thought
    darwin>bergson Creative Evolution
    james~bergson
    brentano>husserl his teacher
    descartes>husserl Cartesian Meditations
    frege~husserl
    hegel>dewey
    peirce>dewey
    james>dewey
    darwin>dewey The Influence of Darwin on Philosophy
    plato>whitehead footnotes to Plato
    leibniz>whitehead
    einstein>whitehead The Principle of Relativity
    bergson~whitehead
    shankara>vivekananda Advaita Vedanta
    thoreau>gandhi Civil Disobedience
    upanishads>gandhi the Gita
    james>nishida pure experience
    chan>nishida Zen practice
    bergson~nishida
    frege>russell
    mill>russell his godfather
    leibniz>russell
    hegel>lukacs
    marx>lukacs
    kierkegaard~lukacs
    frege>wittgenstein
    russell>wittgenstein his teacher, then his pupil
    schopenhauer>wittgenstein
    kierkegaard~wittgenstein the most profound thinker of the last century
    augustine~wittgenstein the Investigations open with the Confessions
    husserl>heidegger his teacher
    kierkegaard>heidegger
    nietzsche>heidegger
    aristotle>heidegger
    dilthey>heidegger
    scotus~heidegger his habilitation thesis
    laozi~heidegger tried to translate the Daodejing, 1946
    dewey>ambedkar his teacher at Columbia
    buddha>ambedkar converted in 1956
    dewey>hushih his teacher at Columbia
    frege>carnap attended his lectures
    russell>carnap
    marx>benjamin
    lukacs~benjamin
    heidegger>marcuse wrote his habilitation under him
    marx>marcuse
    freud>marcuse Eros and Civilization
    heidegger>gadamer
    dilthey>gadamer
    plato>gadamer
    nishida>nishitani his teacher
    heidegger>nishitani studied with him in Freiburg
    nietzsche>nishitani nihilism
    freud>lacan the return to Freud
    saussure>lacan the signifier
    hegel>kojeve
    heidegger>kojeve
    marx>kojeve
    kojeve>lacan attended the lectures
    einstein>popper the eclipse of 1919
    hume>popper the problem of induction
    kant>popper
    hegel>adorno
    marx>adorno
    benjamin>adorno
    freud>adorno
    war>adorno after Auschwitz
    husserl>sartre
    heidegger>sartre
    kojeve~sartre
    descartes>sartre
    kierkegaard~sartre
    heidegger>arendt
    augustine>arendt her thesis on love in Augustine
    kant>arendt judgment
    war>arendt The Origins of Totalitarianism
    benjamin>arendt edited his Illuminations
    husserl>levinas studied with him
    heidegger>levinas
    war>levinas five years a prisoner of war
    scripture~levinas Talmudic readings
    whitehead>quine his doctoral supervisor
    russell>quine
    carnap>quine his teacher and foil
    hegel>beauvoir
    sartre>beauvoir
    kojeve~beauvoir
    wollstonecraft~beauvoir
    husserl>merleaupont
    kojeve>merleaupont attended the lectures
    bergson~merleaupont
    saussure>levistrauss through Jakobson in New York
    plato>weil
    aristotle~austin an Aristotle scholar
    nietzsche>camus
    kierkegaard>camus
    augustine>camus his thesis on Plotinus and Augustine
    weil>camus published her work after her death
    wittgenstein>anscombe his student and translator
    aristotle>anscombe
    aquinas>anscombe
    plato>murdoch
    weil>murdoch attention
    sartre~murdoch wrote the first book in English on him
    wittgenstein~murdoch
    kant>rawls
    rousseau>rawls the social contract
    locke>rawls
    mill~rawls
    quine~kuhn the dogmas of empiricism
    popper~kuhn his rival
    wittgenstein~kuhn
    spinoza>deleuze
    nietzsche>deleuze Nietzsche and Philosophy
    bergson>deleuze Bergsonism
    hume>deleuze his first book
    leibniz~deleuze the fold
    freud~deleuze Anti-Oedipus, against it
    hegel>fanon master and slave
    sartre>fanon
    merleaupont>fanon heard him lecture in Lyon
    freud>fanon a psychiatrist's training
    quine>putnam
    carnap~putnam
    turing>putnam the mind as a machine table
    nietzsche>foucault
    heidegger>foucault
    kant>foucault What is Enlightenment?
    marx~foucault
    kant>habermas
    hegel>habermas
    marx>habermas
    peirce~habermas
    austin~habermas speech acts
    gadamer~habermas their debate
    husserl>derrida his first books
    heidegger>derrida
    nietzsche>derrida
    levinas>derrida
    saussure>derrida Of Grammatology
    austin>derrida Signature Event Context
    dewey>rorty
    james>rorty
    wittgenstein>rorty
    heidegger>rorty
    quine>rorty
    kuhn>rorty
    rawls>nozick his colleague and opponent
    locke>nozick
    wittgenstein>kripke Wittgenstein on Rules and Private Language
    quine~kripke
    leibniz~kripke possible worlds
    quine>dennett his teacher
    darwin>dennett Darwin's Dangerous Idea
    turing>dennett
    bentham>singer
    mill>singer
    hegel>butler her thesis on desire in French Hegelianism
    foucault>butler
    derrida>butler
    austin>butler performatives
    beauvoir>butler becoming a woman
    lacan~butler
    wittgenstein>vienna the Tractatus, read line by line
    russell>vienna
    einstein>vienna
    carnap>vienna
    vienna>quine visited in 1932
    vienna>popper its loyal opposition
    marx>frankfurt
    lukacs>frankfurt
    adorno>frankfurt
    marcuse>frankfurt
    freud>frankfurt
    frankfurt>habermas Adorno's assistant
    sartre>existentialism
    beauvoir>existentialism
    camus~existentialism he refused the name
    kierkegaard~existentialism
    existentialism~fanon
    saussure>structuralism
    levistrauss>structuralism
    lacan>structuralism
    structuralism>foucault
    structuralism>derrida
    wittgenstein>ordinary the later Wittgenstein
    austin>ordinary
    foucault>poststruct
    derrida>poststruct
    deleuze>poststruct
    existentialism>continental
    poststruct>continental
    frankfurt~continental
    habermas>continental
    arendt>continental
    gadamer>continental
    levinas>continental
    butler>continental
    fanon~continental
    nishitani~continental the Kyoto School in dialogue
    rorty~continental
    ordinary>analytic
    kripke>analytic
    rawls>analytic
    nozick>analytic
    putnam>analytic
    dennett>analytic
    singer>analytic
    anscombe>analytic
    murdoch~analytic
    rorty~analytic
  `;

  // the tradition each one wrote in, which colors them and the lines they start; everyone else is 'west',
  // Europe and the Americas from the end of antiquity on
  const traditions = {
    ancient: 'thales anaximander anaximenes pythagoras xenophanes heraclitus parmenides anaxagoras zeno empedocles protagoras leucippus socrates democritus plato diogenes aristotle pyrrho epicurus cicero lucretius seneca epictetus marcus sextus plotinus augustine boethius stoicism',
    east: 'confucius laozi mozi mencius zhuangzi xunzi hanfei zhuxi dogen wangyangming nishida hushih nishitani chan',
    india: 'buddha nagarjuna shankara ramanuja vivekananda gandhi ambedkar',
    islam: 'alkindi alfarabi avicenna alghazali averroes maimonides',
  };
  const tradition = new Map();
  for (const t in traditions) for (const id of traditions[t].split(' ')) tradition.set(id, t);

  const nodes = [];
  for (const [id, name, born, died, place, x, idea, o = {}] of people) {
    nodes.push({ id, kind: 'person', name, born, died, place, x, idea, at: o.at ?? born + 30, circa: !!o.c, when: o.when, short: o.short || name });
  }
  for (const [id, name, year, place, x, idea, o = {}] of schools) {
    nodes.push({ id, kind: 'school', name, year, place, x, idea, at: o.at ?? year, when: o.when, who: o.who, short: name.replace('\n', ' ') });
  }
  for (const [id, name, year, x, idea, o = {}] of sources) {
    nodes.push({ id, kind: 'source', name, year, x, idea, at: o.at ?? year, when: o.when, short: name.replace('\n', ' ') });
  }
  for (const [id, name, year, x] of ends) {
    nodes.push({ id, kind: 'end', name, x, at: year, short: name });
  }
  for (const n of nodes) n.t = n.kind === 'source' ? 'source' : tradition.get(n.id) || 'west';

  const edges = [];
  for (const raw of lines.trim().split('\n')) {
    const m = raw.trim().match(/^(\w+)([>~])(\w+)\s*(.*)$/);
    if (!m) continue;
    edges.push({ from: m[1], to: m[3], weak: m[2] === '~', note: m[4] || '' });
  }

  return { nodes, edges };
})();
