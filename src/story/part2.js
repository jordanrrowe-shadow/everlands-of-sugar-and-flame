// Chapters 6–11.
const A = 'Amber', K = 'Kim', R = 'Ruby', SM = 'Smorella', TF = 'Tafford', P = 'Madame Praline', GL = 'Grandma Lava';
const all = (...fl) => (f) => fl.every((x) => f[x]);

// ───────────────────────── Chapter 6 ─────────────────────────
const ch6 = {
  decor: [{ prop: 'picnic', at: 'choc_shore', if: 'c6_lake', dx: 2.2, dz: 1.5 }],
  n: 6, title: 'A Most Unusual Cup of Chocolate', world: 'sugar', time: 'day', spawn: 'market',
  intro: 'The trouble began with an old story.',
  companion: () => 'kim',
  steps: [
    { goal: 'A picnic at Chocolate Lake, with two essential cups.', hint: 'West of town, in a hollow among low hills. Kim said so on your first day.', until: 'c6_lake', lead: 1 },
    { goal: 'Something is paddling up to look at you.', hint: 'Down at the biscuit-crumb shore. Kim has pistachios.', until: 'c6_turtle' },
    { goal: 'Two travellers are sharing a bench and a bag of toffee.', hint: 'Along the shore, a little south. Walk near enough to hear.', until: 'c6_story' },
    { goal: 'Tell her.', hint: 'Kim is holding out a cup.', until: 'c6_told' },
    { goal: 'Show her what a flame can do.', hint: 'Hold your flame.', until: 'c6_bird' },
    { goal: 'Sit until the chocolate cools.', hint: 'Kim has a hundred questions. Answer them all — and one thing more.', until: 'c6_end' },
  ],
  npcs: [
    { id: 'trav1', at: 'bench1', talk: [['Traveller', 'Toffee? No? More for us.']] },
    { id: 'trav2', at: 'bench2', talk: [['Second Traveller', 'We collect legends. This kingdom has surprisingly few frightening ones. Disappointing, professionally.']] },
    { id: 'praline', at: 'praline', talk: [[P, 'Chocolate Lake? Take cups. And don’t let that girl talk you into swimming.']] },
  ],
  things: [
    { id: 'arrive', at: 'choc_shore', auto: 14, if: (f) => !f.c6_lake, script: [
      'The lake lies wide and dark and perfectly smooth, with a shore of pale biscuit crumbs that crunch underfoot. Ducks the color of caramel paddle near the reeds.',
      [A, 'Can you drink it?'], [K, 'Of course. That’s what the cups are for. Dad says the lake is the reason nobody in Sugarland has ever been in a hurry.'], { set: 'c6_lake' }] },
    { id: 'turtle', at: 'turtle', label: 'The turtle', prop: 'turtle', if: (f) => f.c6_lake && !f.c6_turtle, script: [
      'Its shell is a spiral of pale green and cream, wound around itself like a pastry and scalloped at the rim like the edge of a pie, glittering with a crust of sugar.',
      [K, 'Pistachio Swirl Turtles. They live under the little chocolate falls on the far side, among the sugar lilies. They’ll follow you all afternoon if you have nuts.'],
      { c: [['Toss it a pistachio.', ['The turtle catches it neatly, blinks its thanks and goes on watching Amber, as if she were the more interesting of the two.']], ['Hold one out on your palm.', ['It takes the nut with great delicacy, and stays.']]] },
      { set: 'c6_turtle' }] },
    { id: 'overhear', at: 'bench', auto: 9, if: (f) => f.c6_turtle && !f.c6_story, script: [
      ['Traveller', '…and their queen dresses in hearts from her crown to her shoes. A dreadful temper. Over a game of croquet, I was told.'],
      ['Second Traveller', 'That’s nothing. My grandfather used to tell of a land with mountains of fire. Whole mountains, burning from the inside. And creatures living on them that could burn down a village with a single breath.'],
      ['Traveller', 'Imagine living among them.'], ['Second Traveller', 'Imagine living next door.'], 'They both shudder happily.',
      'Amber stops walking. The words are too familiar.',
      [K, 'Have you heard those stories?'], [A, 'Yes. And they’re wrong.'], [K, 'You sound very sure.'],
      [A, 'I am. Fire can make beautiful things. It warms homes. It feeds people. It doesn’t make someone cruel.'],
      { fx: 'boil' },
      'A flicker appears between her fingers. She closes her fist, but the heat has already surged outward. Steam curls from the lake. A wide patch of chocolate begins to bubble gently.',
      [A, 'Oh, no.'], [K, 'Well. That’s convenient.'], [A, 'Convenient?'], [K, 'It would be a shame to waste perfectly good hot chocolate.'],
      'At the edge of the bubbling patch, the turtle floats with its eyes half shut, like someone who has just got into a warm bath.',
      { set: 'c6_story' }] },
    { id: 'tell', at: 'player', kimTalk: 1, label: 'Take the cup', if: (f) => f.c6_story && !f.c6_told, script: [
      [A, 'You’re not frightened?'], [K, 'Of hot chocolate?'], [A, 'Of me.'], [K, 'Should I be?'],
      { c: [['Tell her about Emberland.', []], ['Tell her why you crossed the sea.', []]] },
      'She tells her then. The volcanic mountains, the warm markets, the people who shape glass and metal with their flames. That she crossed the sea to learn whether outsiders truly hated her people.',
      [A, 'I’m sorry I didn’t tell you.'], [K, 'I wish you had, but I can understand why you were worried. And I can confirm that your fire has excellent taste.'],
      'Relief is so sudden it makes her eyes sting.',
      [K, 'Hated you? We didn’t know there was anyone to hate. I thought the mountains of fire were something Grandma Lava made up to keep me in bed.'],
      [A, 'They’re real. I can see one from my window.'], [K, 'And the creatures that burn down villages?'],
      'That part was not hers alone to tell. Not yet.',
      [A, 'Nobody at home has ever burned down a village. We light lamps. We bake bread. We make glass.'],
      { set: 'c6_told' }, { tip: 'flame' }] },
    { id: 'bird', at: 'player', flame: 1, self: 1, label: 'Open your hand', if: (f) => f.c6_told && !f.c6_bird, script: [
      'A small flame stands up on her palm, gold at the tip and white at the heart. She has not shown it to anyone since she landed, and her fingers shake a little.',
      'Kim leans in until the light is on her face. She does not flinch.',
      [K, 'Does it hurt?'], [A, 'No. It’s only warm. It’s as much a part of me as my voice.'], [K, 'Can you make it do things?'],
      { fx: 'bird' },
      'The flame stretches, folds and becomes a tiny bird with its wings spread. It flies one circle above the cups and goes out in a curl of smoke.',
      'Kim claps, quite seriously, the way people clap for the taffy-pullers when they have done something difficult.', [K, 'Again.'], { set: 'c6_bird' }] },
    { id: 'ask', at: 'player', kimTalk: 1, label: 'Sit with Kim', if: (f) => f.c6_bird && !f.c6_end, script: [
      { hub: [
        { q: '“The coat. You wear it in full sun.”', once: 1, a: [[A, 'There’s a volcano at home. Everything is warm. The streets, the walls, the bath water. I’ve been cold since the moment I landed. I thought it would be rude to say so.'], [K, 'It would have been useful to say so. Mum would have knitted you something by now. She may have started already. She saw your hands.'], [K, 'That’s Sugarland. You can’t be cold here in private.']] },
        { q: '“What do your houses look like?”', once: 1, a: [[A, 'Dark stone, with windows of colored glass, so that when the lamps are lit at night every street looks like a row of lanterns.']] },
        { q: '“And festivals? You must have festivals.”', once: 1, a: [[A, 'The biggest is the First Flame. Everyone carries a light through the streets. It’s next week. I’ve never missed one.'], [K, 'Then you’ll be going home soon.'], [A, 'I only meant to stay a day or two. I keep finding reasons.'], [K, 'Am I one of the reasons?'], [A, 'You’re most of them.'], [K, 'I should like to see a street full of lights. I don’t suppose a person from Sugarland could simply turn up.'], [A, 'I don’t know. Nobody has ever tried.'], { set: 'c6_fest' }] },
        { q: 'There’s something else. I haven’t been staying at the Sugar Plum.', if: 'c6_fest', once: 1, a: [[K, 'I know.'], [A, 'You know?'], [K, 'I took you a cinnamon twist on the second morning. They had never heard of you. I thought you’d tell me where you were sleeping when you wanted to.'], [A, 'You didn’t mind?'], [K, 'I minded the cinnamon twist. I had to eat it myself.'], { set: 'c6_inn' }] },
      ], exit: 'There’s someone I’d like you to meet.', need: 'c6_inn' },
      'She touches the ruby whistle beneath her collar.',
      [A, 'Someone very important to me.'], [K, 'Another mysterious friend?'], [A, 'Very mysterious. But promise you won’t be frightened.'], [K, 'I promise to try.'], { set: 'c6_end' }] },
  ],
};

// ───────────────────────── Chapter 7 ─────────────────────────
const ch7 = {
  n: 7, title: 'The Ruby Flame', world: 'sugar', time: 'dusk', spawn: 'signpost',
  intro: '“Before I show you, promise me you won’t be frightened.”',
  companion: () => 'kim',
  ruby: (f) => f.c7_ruby ? 'clearing_ruby' : null,
  canWhistle: (f) => f.c7_clearing && !f.c7_ruby,
  whistle: (f) => f.c7_clearing && !f.c7_ruby ? [
    'The sound is soft and clear, almost like a distant musical note carried on the wind. For a moment, nothing happens.',
    [K, 'Was something supposed to…'], 'A deep rustling. Two enormous wings rise above the treetops.', [K, 'Oh.'],
    { ruby: 'arrive', at: 'clearing_ruby' },
    'Her scales are dark as polished obsidian, scattered with brilliant ruby-red that glows softly, like embers stirring beneath charcoal.',
    [A, 'Ruby!'], 'The dragon presses her snout gently against Amber’s shoulder.', [A, 'I missed you too.'], { set: 'c7_ruby' }] : null,
  steps: [
    { goal: 'Lead Kim down the forest path.', hint: 'South from the signpost, to the quiet clearing by the rocky hillside.', until: 'c7_clearing' },
    { goal: 'Lift the whistle to your lips.', hint: 'The ruby whistle.', until: 'c7_ruby' },
    { goal: 'Kim has questions.', hint: 'Sit on the smooth rock beside Ruby and talk.', until: 'c7_story' },
    { goal: '“Can I touch her?” — “Why don’t you ask her?”', hint: 'Stand with Kim in front of Ruby.', until: 'c7_end' },
  ],
  things: [
    { id: 'banter1', at: 'forest_path', auto: 8, once: 1, script: [[K, 'Are you finally going to tell me where we’re going?'], [A, 'Almost there.'], [K, 'You said that ten minutes ago.'], [A, 'And I was almost there ten minutes ago.']] },
    { id: 'banter2', at: 'forest_mid', auto: 8, once: 1, script: [[K, 'You’re terrible at keeping secrets, you know.'], [A, 'Actually, I think I’m rather good at it.'], [K, 'Well, you’re certainly good at making people curious.']] },
    { id: 'clearing', at: 'clearing', auto: 9, if: (f) => !f.c7_clearing, script: [
      [A, 'All right. Before I show you, promise me you won’t be frightened.'], [K, 'That is a very strange thing to say right before showing someone a surprise.'], [A, 'Just promise.'], [K, 'Fine. I promise to try.'],
      { set: 'c7_clearing' }, { tip: 'whistle' }] },
    { id: 'talk', at: 'clearing_rock', label: 'Sit on the rock', if: (f) => f.c7_ruby && !f.c7_story, script: [
      [K, 'You have a dragon?'], [A, 'Not exactly. Ruby isn’t mine.'], [K, 'But she came when you called.'], [A, 'Of course she did. We’re bonded.'],
      'For the first time since she arrived, Amber undoes the two cherries at her throat and lets the coat fall open. Beside Ruby, she is warm.',
      { hub: [
        { q: 'Kim: “Bonded?”', once: 1, a: [[A, 'In Emberland, dragons live freely in the Dragon Mountains. Every Emberian carries a flame within them. Dragons do too. We don’t speak the same language, but we can feel things through that connection.'], 'Ruby nudges Amber.', [A, 'Yes, yes. I’m getting to that part.'], [K, 'Did she just understand you?'], [A, 'In her own way.'], { set: 'c7_a' }] },
        { q: 'Kim: “And Ruby chose you?”', once: 1, a: [[A, 'We chose each other. When I turned six, my father took me to the Dragon Mountains. There were so many: blue flames, green, gold, even white and pink.'], [A, 'I wandered off and found a little dragon trying to climb a rocky ledge. Every time she reached the top, she’d slip right back down. So I tried climbing it myself.'], [K, 'Did you make it?'], [A, 'Not even close. We both fell into a pile of warm ash. And I felt a little warmth in my chest that hadn’t been there before.'], [R, '(A low, pleased rumble.)'], [A, 'She felt it too.'], { set: 'c7_b' }] },
        { q: 'Kim: “That whistle…”', once: 1, a: [[A, 'After our flames bonded, we celebrated the Flame Bond Ceremony. Ruby used her flame to soften the stone, and together we shaped it. It’s how we can always find each other.'], 'She places it in Kim’s palm. It is surprisingly warm.', [K, 'It’s beautiful.'], { set: 'c7_c' }] },
        { q: 'Kim: “A title?”', if: 'c7_c', once: 1, a: [[A, 'The Ruby Flame. Royal-bonded dragons are given a place on the Council of Eternal Flames. She’s still young, but one day she’ll sit alongside dragons who were companions to kings and queens centuries ago.'], [K, 'So she’ll be part of your kingdom’s history?'], 'Amber rests her forehead against Ruby’s.', [A, 'She already is.'], { codex: 'council' }, { set: 'c7_d' }] },
      ], exit: '(Kim is watching Ruby thoughtfully.)', need: all('c7_a', 'c7_b', 'c7_d') },
      { set: 'c7_story' }] },
    { id: 'touch', at: 'clearing_ruby', r: 7, label: 'Stand with Kim', if: (f) => f.c7_story && !f.c7_end, script: [
      [K, 'Can I touch her?'], [A, 'Why don’t you ask her?'],
      [K, 'Hello, Ruby. I’m Kim. Amber’s told me a lot about you. Well, actually, she only just told me about you, but she seems to like you very much.'],
      [A, 'Kim!'], [K, 'What? I’m being polite!'], [R, '(A low rumble that sounds almost like laughter.)'],
      'Slowly, Ruby lowers her head. Kim places her hand against the dark scales. Wonderfully warm, like a stone that has spent the entire afternoon beneath the sun.',
      [K, 'She’s lovely.'], [K, 'Amber? Why did you think I’d be frightened?'],
      { c: [['Because we’re told people from other lands are afraid of us.', [[A, 'Of our fire. Of our dragons. People don’t always understand things they’ve never seen.']]], ['Because fire can be dangerous, I suppose.', []]] },
      [K, 'Well, I suppose a dragon could be frightening. But so could a very large oven. That doesn’t mean I’d stop baking.'],
      'Amber stares at her. Then she laughs.',
      [A, 'See, Ruby? I told you they weren’t all afraid of us.'],
      'Perhaps the world beyond her kingdom wasn’t something she needed to fear. Perhaps it was something she had been waiting to discover.',
      { set: 'c7_end' }, { set: 'rideSugar' }] },
  ],
};

// ───────────────────────── Chapter 8 ─────────────────────────
const ch8 = {
  n: 8, title: 'The Stone That Remembers', world: 'sugar', time: 'day', spawn: 'market',
  intro: '“Do the dragons attend your festivals? What do you eat for breakfast?” — “Usually breakfast.”',
  companion: () => 'kim',
  steps: [
    { goal: 'Kim is taking you to see the workshop at last.', hint: 'East of the market: stained-sugarglass windows and a crooked chimney.', until: 'c8_in', lead: 1 },
    { goal: 'Look around the workshop.', hint: 'The great windows, the shelves of treasures, and something curled in a caramel bowl.', until: 'c8_looked' },
    { goal: 'Kim promised to show you how taffy is pulled.', hint: 'The worktable.', until: 'c8_bracelet' },
    { goal: 'May I see?', hint: 'Look closely at the stone on Kim’s wrist, then show her your own.', until: 'c8_crests' },
    { goal: 'Smorella has heard.', hint: 'She is coming in from the kitchen.', until: 'c8_end' },
  ],
  npcs: [
    { id: 'smorella', at: 'workshop_s', if: 'c8_crests', talk: (f) => f.c8_end ? [[SM, 'This way, dear.']] : [
      [SM, 'What did you say?'], [K, 'Mum, Amber knows what my bracelet is.'],
      'Smorella sits down slowly. Tafford joins them. For a moment the only sound is Tira stirring beneath the table.',
      'Kim has always known that Smorella and Tafford adopted her: how they found her by the shore, how little was known of where she came from. The mystery never made her feel less loved. But now, for the first time, it has a direction.',
      [SM, 'There’s something else. Something we kept.'], [K, 'The cradle?'], [SM, 'I think Amber should see it.'], { set: 'c8_end' }] },
    { id: 'tafford', at: 'workshop_t', talk: [[TF, 'Mind the cooling racks. And the cat. Mostly the cat.']] },
  ],
  things: [
    { id: 'in', at: 'workshop', auto: 8, if: (f) => !f.c8_in, script: ['Enormous arched windows of stained sugarglass scatter rose, lavender and golden light across the room. The air smells of warm caramel, vanilla, and freshly pulled taffy.', [A, 'Your parents made all of these?'], [K, 'Most of them. Dad shapes the glass, and Mum makes the colors. I help with the sweets, mostly.'], { set: 'c8_in' }] },
    { id: 'win', at: 'wwindow', label: 'The windows', if: (f) => f.c8_in && !f.c8_win, script: [[A, 'Did your parents make the windows too?'], [K, 'When they first opened the shop. Mum designed the flowers, and Dad shaped the glass.'], [A, 'So the whole shop is one of their creations.'], [K, 'Well. The parts that sparkle, anyway.'], { set: 'c8_win' }, { go: 'looked' }] },
    { id: 'shelf', at: 'wshelf', label: 'The shelves', if: (f) => f.c8_in && !f.c8_shelf, script: ['Sugarglass flowers in pink and violet, tiny birds on crystal branches, caramel vases glowing like captured honey — and a little sugarglass castle no larger than her hand.', { set: 'c8_shelf' }, { go: 'looked' }] },
    { id: 'cat', at: 'wcat', label: 'The caramel bowl', prop: 'cat', if: (f) => f.c8_in && !f.c8_cat, script: [
      'Curled inside a wide caramel bowl is a fluffy white cat. For a moment Amber wonders whether she is another sculpture. Then the cat opens one eye.',
      [A, 'I didn’t realize you had a cat.'], [K, 'Well, we don’t exactly have her. She’s a Crèmewalk Cat. She comes and goes whenever she pleases.'],
      'The cat taps a little ball of twisted licorice off the table, watches it fall, then looks at Kim.',
      { c: [['Pick it up for her.', ['The cat inspects it with a satisfied blink and returns to her bowl, a perfect white cloud in a patch of golden sunlight.']], ['“She expects us to pick those up?”', [[K, 'Of course she does.'], 'Kim retrieves it. The cat approves.']]] },
      { set: 'c8_cat' }, { go: 'looked' }] },
    { id: 'taffy', at: 'wtable', label: 'The worktable', if: (f) => f.c8_looked && !f.c8_bracelet, script: [
      [K, 'Now. I promised to show you how we pull taffy.'], 'She begins slipping off her lace gloves. Amber realizes she has never seen her without them.',
      [A, 'Do you always wear those?'],
      [K, 'Since I was little. Mum made my first pair so I wouldn’t catch my bracelet on things in here. Lace and taffy is a mistake you make once.'],
      'Amber is no longer listening. She is looking at Kim’s wrist.',
      { img: 'heirloom' },
      'A translucent, multicolored Flame Stone, shaped like a small dancing flame. Within it, golden birds face one another beneath a star, above a tiny flame.',
      [A, 'Kim. Where did you get that?'], [K, 'My bracelet? I’ve had it forever. It came with me when I was a baby.'], { set: 'c8_bracelet' }, { codex: 'heirloom' }] },
    { id: 'see', at: 'player', kimTalk: 1, label: 'May I see?', if: (f) => f.c8_bracelet && !f.c8_crests, script: [
      { cut: [{ bg: 'workshop' }, { amber: 'worried' }, { kim: 'smile' },
        'She holds the stone toward the window. The craftsmanship is unmistakably Emberian, although she does not recognize the family design.',
        [A, 'It’s a Flame Stone. An Emberian birth keepsake. When a child is born, their parents can shape one with their own flames.'],
        { kim: 'shy' }, [K, 'But I’m from Sugarland.'], [A, 'You grew up here. I know. But this stone was made in Emberland.'],
        [K, 'Mum and Dad have been helping me make it bigger for years. They kept the first chain just as it was, then added these Sugar Twist links and Sugarspun Silver beads each time I needed more room.'],
        { amber: 'smile' }, [A, 'It’s beautiful. And the original part is still there.'],
        'Amber pushes back the thick white cuff of her coat. Beneath it, on a fine gold chain, a red Flame Stone catches the light.'] },
      { img: 'crest' },
      { cut: [{ bg: 'workshop' }, { amber: 'smile' }, { kim: 'amazed' },
        [A, 'Mine is a dragon beneath a crown and a star, surrounded by wings, flame, and laurel.'],
        [K, 'You’ve had one all this time?'], [A, 'Under the cuff.'],
        { kim: 'laugh' }, { amber: 'laugh' }, [K, 'And mine’s been under my gloves. We’ve been walking about for days with the same thing on our wrists, and neither of us could see it for being dressed.']] },
      { codex: 'crests' },
      { hub: [
        { q: 'Kim: “Does every family have a dragon?”', once: 1, a: [[A, 'Oh, no. The Chronicle has a feather and an open book. The Forge has a hammer and anvil. The Aria has a harp. The Sanctuary, a flower, for healers. The Wildflame, a tree.']] },
        { q: 'Kim: “And what about mine?”', once: 1, a: [[A, 'I’m afraid I don’t recognize it. But sometimes, when two people marry, they design a new crest together. Maybe the birds represent your parents, or their families coming together.'], [K, 'That’s rather romantic.'], { set: 'c8_new' }] },
      ], exit: '(Two pairs of birds. A flame between them. A star above.)', need: 'c8_new' },
      'Something about the design reminds her of the Lord Regent. The last ambassadors we sent never returned.',
      'What if the birds meant more than the union of two families? What if they meant the meeting of two lands?',
      { c: [['Tell Kim what you fear.', ['She opens her mouth. If the regent’s story were true, people from the land Kim loves would have killed them. She cannot lay that at her friend’s feet with no proof.']],
            ['Hold the thought until you have proof.', ['It is only a possibility, and a terrible one.']]] },
      [K, 'Amber? You looked terribly serious for a moment.'], [A, 'I was just thinking about how many different meanings a crest can have.'],
      [K, 'Whatever it meant to my birth parents, I’m glad Mum and Dad helped me keep wearing it.'], [A, 'Perhaps that’s the loveliest part. It carries a little of both places now.'],
      { set: 'c8_crests' }] },
  ],
  scripts: { looked: [{ if: all('c8_win', 'c8_shelf', 'c8_cat'), then: [{ set: 'c8_looked' }] }] },
};

// ───────────────────────── Chapter 9 ─────────────────────────
const ch9 = {
  n: 9, title: 'The Child from the Sea', world: 'sugar', time: 'dusk', spawn: 'house_door',
  intro: '“Something we’ve kept since the day we found you.”',
  companion: () => 'kim',
  steps: [
    { goal: 'Follow Smorella to the small room at the back of the house.', hint: 'Through Kim’s house, behind the workshop.', until: 'c9_room' },
    { goal: 'You know exactly what this is. Show them.', hint: 'Examine the canopy, the glass, and the rounded base.', until: 'c9_parts' },
    { goal: 'Stay with them a moment.', hint: 'Stand beside the golden cradle.', until: 'c9_end' },
  ],
  npcs: [
    { id: 'smorella', at: 'cradle_s', talk: (f) => !f.c9_room ? [[SM, 'In here, dear.']] : [[SM, 'It was one of the only things she had when we found her. We couldn’t bear to part with it. She slept in it every night when she was little, right beside our bed.'], [TF, 'Even with that strange lid.'], [SM, 'We kept the lid open, of course. We didn’t know what it was for.']] },
    { id: 'tafford', at: 'cradle_t', talk: [[TF, 'We always wondered why anyone would put a lid on a baby’s bed.']] },
  ],
  things: [
    { id: 'room', at: 'cradle', auto: 6, if: (f) => !f.c9_room, script: [
      'Beneath a soft cloth rests a beautiful oval capsule of translucent golden glass. Delicate golden vines curl across its surface, forming little flames along its edges.',
      [A, 'That’s an Emberian cradle!'], [SM, 'You recognize it?'], [A, 'Of course! Every baby in Emberland sleeps in one of these.'], [K, 'Every baby?'], { set: 'c9_room' }, { codex: 'cradle' }] },
    { id: 'canopy', at: 'cradle', label: 'The glass canopy', if: (f) => f.c9_room && !f.c9_p1, script: [[A, 'Babies can’t control their flames yet. Sometimes they release little bursts of fire when they sneeze, or cry, or even dream.'], [SM, 'Fire?'], [A, 'That’s why the cradle has a canopy. The glass absorbs the flames so they can’t hurt anyone.'], [TF, 'That makes so much sense now.'], { set: 'c9_p1' }, { go: 'parts' }] },
    { id: 'glass', at: 'cradle_a', label: 'The golden glass', if: (f) => f.c9_room && !f.c9_p2, script: [[A, 'And it makes its own fresh air, even when it’s completely closed. The baby can sleep safely inside.'], [K, 'All this time, and we never knew.'], { set: 'c9_p2' }, { go: 'parts' }] },
    { id: 'base', at: 'cradle_b', label: 'The rounded base', if: (f) => f.c9_room && !f.c9_p3, script: [[A, 'And you found her inside it?'], [SM, 'Floating near the shore. The waves had carried it all the way to Sugarland.'], [A, 'Of course. It floats. The glass is enchanted to keep the cradle stable, for the warm springs and bathing pools. But I don’t think anyone ever imagined one traveling across an entire sea.'], { set: 'c9_p3' }, { go: 'parts' }] },
    { id: 'stay', at: 'cradle', label: 'Stand beside Kim', if: (f) => f.c9_parts && !f.c9_end, script: [
      'Kim places her hand against the golden glass. Not a strange boat. Not a mysterious treasure. Just a baby’s bed — a bed someone had carefully prepared for her, in a kingdom she had never known.',
      [A, 'Someone must have loved you very much.'], 'Kim smiles, though her eyes have begun to fill. She looks at Smorella and Tafford.', [K, 'And someone still does.'], [SM, 'Always, sweetheart.'],
      'The little capsule had carried Kim away from one life and into another. And somehow, after all those years, it had helped bring the two worlds a little closer together.', { set: 'c9_end' }] },
  ],
  scripts: { parts: [{ if: all('c9_p1', 'c9_p2', 'c9_p3'), then: [{ set: 'c9_parts' }] }] },
};

// ───────────────────────── Chapter 10 ─────────────────────────
const ch10 = {
  n: 10, title: 'Two Homes, One Beginning', world: 'sugar', time: 'dawn', spawn: 'house_door',
  intro: '“You don’t have to choose between where you came from and where you belong.”',
  companion: (f) => f.c10_come ? 'kim' : null,
  steps: [
    { goal: 'Kim went back to the cradle this morning.', hint: 'The small room at the back of the house.', until: 'c10_come' },
    { goal: 'Supper. Kim has something to tell her parents.', hint: 'Smorella is at the table by the oven.', until: 'c10_told' },
    { goal: 'Smorella is packing before anyone can answer. Help her.', hint: 'She wants travel biscuits from Tafford in the workshop, healing herbs from the garden beside the house, and sweets from the market. The Stillbloom she will fetch herself.', until: 'c10_packed' },
    { goal: 'Visitors: a box of sweets and a dozen stories.', hint: 'Grandma Lava and Marsh have arrived outside the workshop.', until: 'c10_lava' },
    { goal: 'One last thing, before leaving.', hint: 'The cradle.', until: 'c10_end' },
  ],
  npcs: [
    { id: 'kim', at: 'cradle_a', if: (f) => !f.c10_come, talk: [
      'The golden glass catches the first light. For the first time Kim imagines someone in Emberland bending over it, arranging the blankets, touching her tiny hand.',
      [K, 'Do you think I’d like it?'], [A, 'Like what?'], [K, 'Emberland.'],
      [A, 'The markets, certainly. And the mountains. Though our desserts may disappoint you.'], [K, 'Are they terrible?'], [A, 'No. Just less ambitious.'],
      [K, 'I’ve never felt as though anything was missing. Mum and Dad gave me everything. But now I know there’s a real place where I was born. I want to see it.'],
      { c: [['Then come with me.', []], ['It won’t be simple. But — come with me.', []]] }, { set: 'c10_come' }, { time: 'dusk' }] },
    { id: 'smorella', at: 'house_s', talk: (f) => !f.c10_come ? [[SM, 'She’s been in the back room since first light, dear.']] : !f.c10_told ? [
      [K, 'I’m not going because I want a different family. I just want to know the place.'],
      [SM, 'You don’t have to choose between where you came from and where you belong. This will always be your home.'],
      [K, 'I know. I love you.'], [TF, 'And we love you. Enough to worry terribly while you’re away.'],
      [SM, 'Is it far?'], [A, 'A day by sea, with a good wind. A little less by air.'], [TF, 'By air. She said by air.'], [SM, 'I heard her. Is it safe?'],
      'Amber thinks of the regent, and the ships that had not come back. She would not lie at this table.',
      { c: [['“I believe the people are. I can’t promise the journey is.”', [[A, 'That’s part of why I have to go home. Somebody ought to find out.'], [SM, 'Thank you for not telling me it was nothing.']], 1],
            ['“It’s perfectly safe.”', ['The words will not come. Not at this table.'], 0]], retry: 1 },
      'Smorella asks whether Emberland has doctors, safe roads, and enough food, then begins packing before either girl can answer.',
      { set: 'c10_told' }, { time: 'day' },
      { lead: 'Smorella’s list: travel biscuits (Tafford, in the workshop), healing herbs (the garden beside the house), sweets (the confectioner in the market).' }] : !f.c10_packed ? [
      { if: all('c10_bis', 'c10_herb', 'c10_sweet'), then: [
        'She fills a sturdy pouch: sweets, travel biscuits, the packet of herbs — and a small stoppered bottle.',
        [SM, 'Stillbloom. Healers use the flower in soothing remedies. The concentrated dust is kept for rare emergencies: it can briefly still a person’s movement.'],
        [SM, 'I doubt you’ll need this. But Amber told us outsiders are feared there. It may help you get away from danger without hurting anyone. A pinch stops a wasp. The whole bottle would stop a carthorse for as long as it takes to boil an egg. Throw it and run.'],
        [K, 'Nobody in the whole world is going to chase me, Mum. You think of everything.'], [SM, 'Not everything. That’s why I pack too much.'],
        'She turns to Amber and holds out a pair of mittens: cream wool with a gold swirl on the back, plainly made to go with the coat.',
        [SM, 'For the sea wind. I had the colors anyway.'], [A, 'You made these for me?'], [SM, 'I made them for your hands. You happen to come with them.'],
        { give: 'stillbloom' }, { set: 'c10_packed' }, { lead: 'Grandma Lava and Marsh have come to see Kim off. They are outside the workshop.' }],
        else: [[SM, 'Biscuits, herbs, sweets. Then we’ll see about the rest.']] }] : [[SM, 'Write. Eat. And keep your gloves dry.']] },
    { id: 'tafford', at: 'workshop_t', talk: (f) => f.c10_told && !f.c10_bis ? [[TF, 'Travel biscuits. Hard as roof tiles and twice as loyal. Take the lot.'], { set: 'c10_bis' }] : [[TF, 'By air, she said.']] },
    { id: 'tartman', at: 'tart', talk: (f) => f.c10_told && !f.c10_sweet ? [['Confectioner', 'For Kim’s journey? Then they’re not for sale. Lemon drops, sugared violets, and one pickle. For balance.'], { set: 'c10_sweet' }] : [['Confectioner', 'Safe travels to anyone who’s travelling!']] },
    { id: 'lava', at: 'lava', if: 'c10_packed', talk: (f) => f.c10_lava ? [[GL, 'With presents, mind.']] : [
      [GL, 'They always come home in my stories. See that you do it properly. With presents.'],
      [K, 'What if I come home different?'], [GL, 'I should hope you will. Nobody goes all that way to stay the same.'],
      'The old woman looks at Amber over Kim’s shoulder, a long measuring look, and seems satisfied.',
      [GL, 'I told this one for years there were lands beyond the sea. She thought I was making it up to get her to sleep.'], [K, 'You were making it up.'], [GL, 'And it was true as well. The best ones are.'],
      { set: 'c10_lava' }] },
    { id: 'marsh', at: 'marsh', if: 'c10_packed', talk: [['Marsh', 'Sea winds. Keep the bow a hand’s width off the gust and never argue with a tide. The Sweet Breeze goes out to sea at night — leave at first light and it will see you off.']] },
  ],
  things: [
    { id: 'herbs', at: 'garden_herbs', label: 'Gather healing herbs', prop: 'herbs', if: (f) => f.c10_told && !f.c10_herb, script: ['A little packet of healing herbs, tied with thread.', { set: 'c10_herb' }] },
    { id: 'last', at: 'cradle', label: 'The golden cradle', if: (f) => f.c10_lava && !f.c10_end, script: ['She touches the golden cradle one last time. She will not take it with her. It belongs here, where her parents watched her sleep.', 'She takes the bracelet instead.', { set: 'c10_end' }] },
  ],
};

// ───────────────────────── Chapter 11 ─────────────────────────
const CW = 'Cinderwardens';
const gifts = [{ if: all('g_honey', 'g_cider', 'g_draw', 'g_rug', 'g_trees'), then: [[K, 'That’s everything the workshop can hold. Ruby should see it before we go.'], { set: 'c11_gifts' }, { lead: 'Ruby is waiting in the forest clearing.' }] }];
const ch11 = {
  n: 11, title: 'A Little Piece of Sugarland', world: 'sugar', time: 'day', spawn: 'workshop_door',
  intro: 'Amber had intended to return with stories. Kim convinced her to return with evidence.',
  companion: () => 'kim',
  ruby: (f) => !f.c11_plan ? 'clearing_ruby' : null,
  steps: [
    { goal: '“Let them see what we make.” Gather Sugarland’s gifts.', hint: 'Word has got around. A boy with honey and a very small girl are near the fountain; the cider seller is in the market; Madame Praline has a flat box; and two young candy cane trees wait at the forest’s edge.', until: 'c11_gifts' },
    { goal: 'Show Ruby the collection.', hint: 'The forest clearing, south.', until: 'c11_plan' },
    { goal: 'First light. Sail from the coast.', hint: 'The dock is on the eastern shore, south-east of the meadows.', until: 'c11_sail' },
    { goal: 'Home is on the far side of the fog.', hint: 'Stand at the bow.', until: 'c11_fog' },
    { goal: 'CALL HER.', hint: 'The ruby whistle!', until: 'c11_whistle' },
    { goal: 'Take what you can!', hint: 'The travel pouch, by the mast.', until: 'c11_pouch' },
    { goal: '“Take us home, Ruby. Please.”', hint: 'Up, out of the fog, toward the glow of the mountain.', until: 'c11_end' },
  ],
  canWhistle: (f) => f.c11_fog && !f.c11_whistle,
  whistle: (f) => f.c11_fog && !f.c11_whistle ? ['Its clear note cuts through the noise. Ruby is already diving.', { set: 'c11_whistle' }, [A, 'Kim! Take what you can!']] : null,
  npcs: [
    { id: 'boy', at: 'gift_boy', if: (f) => !f.c11_sail, talk: (f) => f.g_honey ? [['Honey Boy', 'Tell them the bees say hello.']] : [['Honey Boy', 'It’s peppermint honey. For the fire people. My bees made it, so it’s sort of from them.'], { set: 'g_honey' }, ...gifts] },
    { id: 'girl', at: 'gift_girl', if: (f) => !f.c11_sail, talk: (f) => f.g_draw ? [['Very Small Girl', 'She’s smiling because she’s nice.']] : ['A very small girl holds up a drawing of what she says is a dragon, though it has six legs and is smiling.', { c: [['It’s a very good likeness.', [['Very Small Girl', 'I KNOW.']]], ['Six legs?', [['Very Small Girl', 'For running to her friends faster.']]]] }, { set: 'g_draw' }, ...gifts] },
    { id: 'cider', at: 'gift_cider', if: (f) => !f.c11_sail, talk: (f) => f.g_cider ? [['Cider Seller', 'Warm it gently! Though I suppose your lot can manage that.']] : [['Cider Seller', 'A whole cask. You looked cold on the mountain; I expect your whole country’s the same. No? Too warm? Then drink it cold and think of us.'], { set: 'g_cider' }, ...gifts] },
    { id: 'praline', at: 'praline', if: (f) => !f.c11_sail, talk: (f) => f.g_rug ? [[P, 'Then keep it a while longer.']] : [
      [P, 'For your father. I hear he’s poorly. It’s a lap rug. Same wool as your collar.'], [A, 'I never told you he was ill.'],
      [P, 'You told Kim, who told her mother, who told the baker, who told me. You’re in Sugarland, child.'], 'She gives the collar a small proprietary tug.', [P, 'Still cold?'], [A, 'Not as often.'], [P, 'Then keep it a while longer.'], { set: 'g_rug' }, ...gifts] },
    { id: 'smorella', at: 'dock_s', if: 'c11_plan', talk: (f) => f.c11_sail ? null : [
      'Smorella embraces Kim twice. Tafford presses an extra packet of biscuits into her hands. Tira has settled the question of whether she is coming by getting into the travel pouch and refusing to get out.',
      [SM, 'Write.'], [K, 'I will.'], [SM, 'Eat.'], [K, 'Mum.'], [SM, 'And keep your gloves dry. Salt ruins the lace.'],
      'She holds Kim’s face in both hands a moment longer. Then, to Amber’s surprise, does the same to her.', [SM, 'You too. Both of you come back.'],
      { fade: 'The Vanilla Sea glittered behind them' }, { world: 'sea', at: 'deck', time: 'day', boat: 1 }, { set: 'c11_sail' },
      'Kim stands among the crates, imagining the faces of glassmakers who have never seen a candy cane tree. Above them, Ruby circles like a dark star against the sun.'] },
    { id: 'tafford', at: 'dock_t', if: 'c11_plan', talk: [[TF, 'Extra biscuits. And extra-extra biscuits, in case of the first extra.']] },
  ],
  things: [
    { id: 'trees', at: 'gift_trees', label: 'Two young candy cane trees', prop: 'sapling', if: (f) => !f.g_trees, script: ['Two saplings in carefully padded pots, striped red around white.', { set: 'g_trees' }, ...gifts] },
    { id: 'rubyplan', at: 'clearing_ruby', r: 7, label: 'Ruby', if: (f) => f.c11_gifts && !f.c11_plan, script: [
      'Ruby sniffs a box of sweets, sneezes, and nearly overturns a sapling.',
      [A, 'She can carry us. But not all of this.'], [K, 'Then we’ll take a boat. Ruby can fly above us and keep watch.'],
      'Amber rests her forehead against warm scales and explains the plan. The dragon answers with a rumble and a slow unfurling of her wings.',
      { set: 'c11_plan' }, { time: 'dawn' }, { lead: 'The boat leaves from the dock on the eastern shore at first light. Smorella and Tafford are there.' }] },
    { id: 'bow', at: 'bow', label: 'Stand at the bow', if: (f) => f.c11_sail && !f.c11_fog, script: [
      [K, 'What will they think of me?'], [A, 'The ones in the market will want to feed you. The glassmakers will want to know how sugar is spun. My father will like you at once.'],
      [K, 'And the regent?'], [A, 'He’ll be the hardest. He has lost a great many people to this sea. But he’s fair. Once he’s met you, he’ll see what I saw.'],
      { fx: 'fogIn' },
      [K, 'Is that land?'], [A, 'It’s the fog. It lies all around Emberland, where our warm water meets the cold. It never lifts. On the far side of it is home.'],
      'It closes over the boat like a curtain. Above them Ruby drops low, so that the red glow along her neck shows through the gray like a lantern carried ahead.',
      [K, 'No wonder nobody ever found you.'],
      { fx: 'ships' }, 'Dark shapes grow out of the fog ahead, tall and close, with lamps burning at their bows.',
      [A, 'The Cinderwardens. They can guide us in.'],
      { c: [['“I am Princess Amber! I’m returning home!”', []], ['“You have my name. Send word to the palace!”', []]] },
      'No answer comes. The nearest vessel changes course, cutting across their path. A second ship closes from the other side.',
      { fx: 'hit' }, 'A projectile strikes the water beside their hull. Another shatters the rail. Kim falls to her knees as the deck lurches.',
      [K, 'They’re attacking us.'], [A, 'They can’t be. They know who I am.'],
      { fx: 'hit' }, 'The third strike tears into the side of the boat. Water rushes below.', { set: 'c11_fog' }, { tip: 'whistle' }] },
    { id: 'pouch', at: 'mast', label: 'Seize the travel pouch', prop: 'pouch', if: (f) => f.c11_whistle && !f.c11_pouch, script: [
      'Tira is already inside it, flat at the bottom with only her ears showing. Kim stuffs in a few sweets and the smallest bundle of flowers.',
      { ruby: 'arrive', at: 'deck' }, 'Ruby sweeps over the deck, carefully closing her great claws around both girls. They rise just as the boat rolls onto its side.',
      { set: 'c11_pouch' },
      { fly: { start: [0, 14, 0], rings: [[0, 40, -90], [30, 60, -200]], barks: { 0: 'From above, Kim watches their gifts scatter into the water: books, clothes, candy cane trees, and the little evidence of Sugarland’s kindness.', 1: 'The Cinderwardens do not attempt a rescue.' } } },
      'All that is left of Sugarland is Kim herself, the pouch at her side with Tira trembling inside it, and the cream-colored coat on Amber’s back.',
      'One terrible possibility enters Amber’s mind: perhaps the lost ambassadors had not been attacked by outsiders at all.',
      [A, 'Take us home, Ruby. Please.'],
      { fly: { world: 'ember', time: 'dusk', start: [230, 70, 60], fog: 0.03, fogTo: 0.004, rings: [[150, 66, 40], [70, 62, -10], [10, 52, -52], [-18, 34, -62]], barks: { 1: 'Ivory towers rise above sweeping archways. Crimson banners. Rivers of glowing lava. And the rooftops: wide circular terraces, broad enough for dragons to land.', 3: [A, 'Hold on!'] }, land: 'terrace' } },
      { set: 'c11_end' }] },
  ],
};

export default [ch6, ch7, ch8, ch9, ch10, ch11];
