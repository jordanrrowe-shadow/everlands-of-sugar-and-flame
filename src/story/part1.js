// Chapters 1–5. Script DSL is documented in README.md.
const A = 'Amber', K = 'Kim', O = 'Master Orin', F = 'The King', L = 'Lord Ashlock', R = 'Ruby';
const all = (...fl) => (f) => fl.every((x) => f[x]);

// ───────────────────────── Chapter 1 ─────────────────────────
const ch1 = {
  n: 1, title: 'A Kingdom of Warmth', world: 'ember', time: 'day', spawn: 'market_s', face: [0, 90],
  intro: 'Amber had never understood why the rest of the world was supposed to be afraid of them.',
  steps: [
    { goal: 'Wander the morning market. Something smells of honey.', hint: 'Master Orin calls from a stall on the west side of the lane: “Fresh from the fire!”', until: 'c1_bun' },
    { goal: 'Find something to brighten Father’s room.', hint: 'Orin said children are crowding a stall where the flames burn blue, violet and gold.', until: 'c1_lantern' },
    { goal: 'Music is rising from the square. Join the First Flame.', hint: 'Speak to the dancers, then use your flame on the three cold hearths around the square.', until: 'c1_dance' },
    { goal: 'Carry your gifts up the great stair to Father.', hint: 'The king’s chamber is straight north through the palace courtyard, beyond the tall doors.', until: 'c1_king' },
    { goal: 'Father said: ask the regent. Find Lord Ashlock.', hint: 'He is fond of the arched window on the east side of the courtyard.', until: 'c1_ashlock' },
    { goal: 'Look out over the thousand friendly flames.', hint: 'The arched window, right beside where the regent stood.', until: 'c1_end' },
  ],
  npcs: [
    { id: 'orin', at: 'orin', talk: (f) => !f.c1_bun ? [
      [O, 'Fresh from the fire! Sweet as sunshine!'],
      'A ribbon of flame curls from his fingertips and caramelizes the honey glaze.',
      { c: [['Orange blossom?', [[O, 'Your Highness remembers!'], [A, 'I remember everything delicious.']]],
            ['It smells wonderful.', [[O, 'Orange blossom this week, Highness. Try it.']]]] },
      [A, 'This may be your best yet.'], [O, 'You said that last week, Highness.'], [A, 'Last week it was true of last week’s.'],
      [O, 'Ha! Here — a second one. For His Majesty. If he’s eating.'], [A, 'He’s eating a little.'], [O, 'Then a little of this.'],
      { give: 'buns' }, { set: 'c1_bun' },
      { lead: 'Orin: the candle-maker has something new this week. Look for the stall where the flames burn blue, violet and gold.' },
      [O, 'And if you want something for his bedside, the candle-maker has a new marvel. Follow the children. They always find her first.'],
    ] : [
      { hub: [
        { q: 'Why do they say the world fears us?', a: [[O, 'Fears us? I’ve never met the world, Highness. It has never come to buy a bun.'], [O, 'All I know is fire makes bread, and bread makes friends. Seems simple enough from behind a tray.']] },
        { q: 'How is the market today?', a: [[O, 'Warm! As it is always warm. Vessa is pulling glass birds across the lane, and Brand has a garden gate half coaxed out of iron.']] },
        { q: 'Where is the candle-maker?', a: [[O, 'South end, by the square. You’ll see the colours before you see the stall.']] },
      ], exit: 'Thank you, Master Orin.' },
    ] },
    { id: 'glass', at: 'glass', talk: [
      'The glassmaker draws a molten sphere between her hands. It becomes a bird whose transparent wings glow pink and amber.',
      ['Glassmaker Vessa', 'Hold still, little one… there. Wings.'],
      { hub: [
        { q: 'How do you keep it from breaking?', a: [['Glassmaker Vessa', 'Patience and a steady flame, Highness. Glass forgives heat. It never forgives hurry.']] },
        { q: 'Would a glass bird survive a sea crossing?', a: [['Glassmaker Vessa', 'What a question! Packed in ash-wool, perhaps. Somebody asked me that once, years and years ago. A small woman who did most of the talking.'], [A, 'Who?'], ['Glassmaker Vessa', 'I couldn’t tell you now. They went away on a ship. People did, then.']] },
      ], exit: 'It’s beautiful.' },
    ] },
    { id: 'metal', at: 'metal', talk: [
      'The metalworker coaxes iron into a curling garden gate with patient, precise heat.',
      ['Ironwright Brand', 'Highness. Mind the sparks — though I suppose they mind you.'],
      { hub: [
        { q: 'What are you making?', a: [['Ironwright Brand', 'A gate for the queen’s garden. The old one sticks. Someone leaves a candle by the statue every evening and I’d not have them fight a hinge to do it.'], [A, 'Do you know who?'], ['Ironwright Brand', 'Never asked. Some kindnesses like the dark.']] },
        { q: 'Have you ever sold to another land?', a: [['Ironwright Brand', 'My master did. Hinges and lamp-brackets, crated for the harbor. Then the harbor closed, and that was that.']] },
      ], exit: 'Good work, Brand.' },
    ] },
    { id: 'candle', at: 'candle', talk: (f) => f.c1_lantern ? [['Candle-maker Lumi', 'May it bring him comfort, Highness.']] : !f.c1_bun ? [['Candle-maker Lumi', 'Blue for calm, violet for dreams, gold for home! Come back when your hands are free, Highness.']] : [
      'Flames burn blue, violet and gold without scorching their wicks. One small golden flame nestles inside red glass.',
      { c: [
        ['The blue flame.', [['Candle-maker Lumi', 'Calm seas, that one. Lovely — though a sickroom has calm enough.']], 0],
        ['The violet flame.', [['Candle-maker Lumi', 'Dream-light. He would sleep, certainly. But would he smile?']], 0],
        ['The golden flame in red glass.', [['Candle-maker Lumi', 'A Fireside Memory. It brightens when someone draws near, but never burns the hand that holds it.'], 'Amber imagines it beside her father’s bed.', [A, 'I’ll take it.'], ['Candle-maker Lumi', 'For His Majesty?'], [A, 'Yes.'], ['Candle-maker Lumi', 'Then may it bring him comfort.']], 1],
      ], retry: 1 },
      { give: 'lantern' }, { set: 'c1_lantern' },
    ] },
    { id: 'dancer', at: 'square', talk: (f) => f.c1_dance ? [['Flame Dancer', 'You always cheer the loudest, Highness.']] : !f.c1_lantern ? [['Flame Dancer', 'We begin when the square is ready. Soon!']] : [
      'Two dancers spin beneath streaming ribbons of fire while a third casts their shadows onto a pale screen.',
      'A village appears, huddled and dark on a cold mountain. A small dragon’s shadow creeps down from the peaks. A child’s shadow holds out a hand.',
      ['Flame Dancer', 'The dragon breathed — and now we need our hearths! Highness, will you light them?'],
      { tip: 'flame' },
      { set: 'c1_hearths' }, { codex: 'firstflame' },
      { lead: 'The dancers need the three cold hearths around the square lit. Stand close and hold your flame.' },
    ] },
    { id: 'child1', at: 'kids', talk: [['Market Child', 'Princess! Are you going to do the First Flame? I know ALL of it. The dragon breathes and then — whoosh!']] },
    { id: 'child2', at: 'kids2', talk: [['Market Child', 'My sister says there are people across the sea with hair like sweets. She makes things up.']] },
    { id: 'king', at: 'king', talk: (f) => f.c1_king ? [[F, 'Old friendships deserve tending, little spark.']] : !f.c1_dance ? [[F, 'Is that the market I hear? Go on. Bring me back the morning.']] : [
      'The chamber is dim. Her father lies against his pillows, his once-strong hands thin atop the blanket. But his smile is immediate.',
      [F, 'My little spark.'], [A, 'Not so little.'],
      'She sets the lantern on his bedside table. Its flame grows brighter.', { take: 'lantern' }, { take: 'buns' },
      [F, 'Then a very thoughtful not-so-little spark.'],
      { hub: [
        { q: 'Tell him about the market.', once: 1, a: [[A, 'Orin’s buns are orange blossom this week. Vessa made a bird with pink wings. And I lit the hearths for the First Flame.'], [F, 'Did the children cheer?'], [A, 'They always do.']] },
        { q: 'Why learn diplomacy when we’re forbidden to speak to anyone?', once: 1, a: [
          'He looks toward the window.', [F, 'There were losses, Amber. Terrible ones.'], [A, 'Then shouldn’t we try to heal them?'], [F, 'I wish it were so simple.'],
          [A, 'Tell me about them, then. The losses.'], [F, 'Another day.'], [A, 'You always say another day.'],
          [F, 'And you always ask on a day when I am tired. Ask the regent. He remembers it better than I do. He has had to.'], { set: 'c1_asked' },
          { lead: 'Father: “Ask the regent.” Lord Ashlock is usually beneath the arched window, east of the courtyard.' }] },
      ], exit: 'Rest, Father.', need: 'c1_asked' },
      'An attendant enters with his afternoon restorative, a bitter dark drink. The king swallows it with a grimace. A cough steals his breath. Amber grips his hand until it passes.',
      [A, 'Rest.'], [F, 'And how is Ruby?'], [A, 'Impatient with me. I’ve been busy.'], [F, 'Old friendships deserve tending.'],
      { set: 'c1_king' },
    ] },
    { id: 'attendant', at: 'king_side', talk: [['Attendant', 'His Majesty’s restorative, Highness. Lord Ashlock’s own instructions. Never a day missed.']] },
    { id: 'ashlock', at: 'window_arch', if: (f) => !f.c1_ashlock, talk: (f) => !f.c1_king ? [[L, 'Your Highness. I believe your father is expecting you.']] : [
      'Lord Ashlock has commanded the Cinderwardens, the gray-cloaked guard of the coasts, since before Amber was born. He has governed in her father’s name since the illness began.',
      { hub: [
        { q: 'Might we send a new ambassador across the sea?', once: 1, a: [[L, 'The last ambassadors never returned. Their ships were attacked. I will not sacrifice more Emberians for the curiosity of other nations.'], { set: 'c1_q1' }] },
        { q: 'But who attacked them?', if: 'c1_q1', once: 1, a: [[L, 'The people you wish to befriend.'], [A, 'How can we be sure?'], [L, 'Because we have learned the cost of trusting outsiders. You will understand when you are older.'], { set: 'c1_q2' }] },
        { q: 'And if they don’t hate us?', if: 'c1_q2', once: 1, a: [
          [L, 'Then they have had every chance to show it. Consider what we know, Your Highness, and not what we wish.'],
          [L, 'No foreign ship has come to our harbors to trade. Not one. No envoy, no letter, no gift. When our own merchants sailed out, they did not come home. We sent more, and those did not come home either.'],
          [L, 'So we tried ambassadors, the best and gentlest people we had. You know how that ended.'],
          'Amber did know. Everyone did.',
          [L, 'That is why no one is permitted to go. It is not to punish you. It is to keep our people alive. I will not add to that list for the sake of a hope.'],
          { set: 'c1_q3' }] },
      ], exit: '…', need: 'c1_q3' },
      'It was a reasonable answer. Everything Lord Ashlock said was reasonable. He gives a small bow and suggests she return to her lessons.',
      { set: 'c1_ashlock' },
    ] },
  ],
  things: [
    { id: 'h1', at: 'hearth1', label: 'Cold hearth', flame: 1, if: (f) => f.c1_hearths && !f.h1, lit: 'h1', script: [{ set: 'h1' }, 'A light blooms.', { if: all('h1', 'h2', 'h3'), then: [{ go: 'hearthsDone' }] }] },
    { id: 'h2', at: 'hearth2', label: 'Cold hearth', flame: 1, if: (f) => f.c1_hearths && !f.h2, lit: 'h2', script: [{ set: 'h2' }, 'Then another, in a window.', { if: all('h1', 'h2', 'h3'), then: [{ go: 'hearthsDone' }] }] },
    { id: 'h3', at: 'hearth3', label: 'Cold hearth', flame: 1, if: (f) => f.c1_hearths && !f.h3, lit: 'h3', script: [{ set: 'h3' }, 'Then a third.', { if: all('h1', 'h2', 'h3'), then: [{ go: 'hearthsDone' }] }] },
    { id: 'look', at: 'window_arch', label: 'Look out over the city', if: 'c1_ashlock', script: [
      { cut: [{ bg: 'balcony' }, { amber: 'smile' },
        'A thousand friendly flames below the window. Bread, beauty, music, shelter.',
        [A, 'Nobody down there looks frightening. They look like people making supper.'],
        { amber: 'worried' }, [A, 'So why is the rest of the world supposed to be afraid of us?'],
        'The sun slips behind the Dragon Mountains. Far beyond them, where no one will tell her what lies, the sky goes on.',
        { amber: 'fierce' }, [A, 'I wonder whether the walls around Emberland are made of stone at all.']] },
      { set: 'c1_end' }] },
  ],
  scripts: { hearthsDone: ['The whole screen glows with hearths. The children cheer for the First Flame, as they always do. Amber cheers with them.', [A, 'Everywhere, fire makes things. Why does anyone see only danger?'], { set: 'c1_dance' }] },
};

// ───────────────────────── Chapter 2 ─────────────────────────
const M = 'Etiquette Mistress', AL = 'Master Aldren';
const ch2 = {
  n: 2, title: 'The Walls We Cannot See', world: 'ember', time: 'day', spawn: 'hall_door',
  intro: 'The map in the Hall of Learning ended at Emberland’s coast.',
  steps: [
    { goal: 'Attend your lesson in the Hall of Learning.', hint: 'Master Aldren is at the map table, west of the courtyard. Ask about more than the eastern harbors.', until: 'c2_map' },
    { goal: 'Etiquette: the seven formal greetings.', hint: 'The mistress waits nearby in the hall. Lower. Open hands.', until: 'c2_bow' },
    { goal: 'Go where you always go when you want to think.', hint: 'Down the west stair, through the small door: the queen’s garden, and your mother’s statue.', until: 'c2_statue' },
    { goal: 'Morning. Request leave to visit the Dragon Mountains.', hint: 'The regent’s chambers are the coolest rooms in the palace: east side, shutters half closed.', until: 'c2_regent' },
    { goal: 'Evening. Sit with Father.', hint: 'His chamber, north of the courtyard.', until: 'c2_father' },
    { goal: 'Your tower room: write the note and pack what little you need.', hint: 'North-west tower. Note at the desk, then the flask, the buns, the coins, the spyglass — and the cape on its hook, last of all.', until: 'c2_end' },
  ],
  npcs: [
    { id: 'aldren', at: 'aldren', talk: (f) => f.c2_map ? [[AL, 'The eastern harbors, Highness. Please.']] : [
      'Master Aldren keeps one palm lit with a small steady flame to read by, though the hall has tall windows and is never dark.',
      [A, 'What’s here?'], 'She taps the empty parchment beyond the coast.', [AL, 'Waters no longer charted by our navigators.'],
      { hub: [
        { q: 'And beyond those waters?', once: 1, a: [[AL, 'Your Highness, our lesson concerns the eastern harbors. Each is watched by the Cinderwardens, who keep the harbor lights and see every ship in and out. They are overseen by Lord Ashlock.'], [A, 'I know. You told me last week. And the week before.']] },
        { q: 'Have you ever met anyone from another land?', once: 1, a: [[AL, 'No.'], [A, 'Has the regent?'], 'Aldren folds the map with extraordinary care.', [AL, 'Some questions belong to those responsible for our safety.'], [A, 'That isn’t an answer.'], [AL, 'No, Highness. It is a habit.'], { set: 'c2_habit' }] },
        { q: 'Was there ever another map?', if: 'c2_habit', once: 1, a: [
          [AL, 'This is the second map I have taught from. The first hung on that wall for most of my years here. It was a good deal larger than this one.'],
          [A, 'Larger how?'], [AL, 'It had more on it. More names. Harbors that were not ours. A coast to the west with a line of little drawings along it. I always thought they looked like cakes.'],
          [A, 'What happened to it?'],
          [AL, 'It was collected, with the others, the year the ambassadors were lost. For safety. So that no young sailor would be tempted to follow it.'],
          'The flame in his palm dips.',
          [A, 'I’m not a child.'], [AL, 'No. You are the heir, which is worse. Everything I tell you may one day be acted upon.'],
          'He puts the map away in its drawer and turns the key.',
          { lead: 'Aldren: the old map was larger. A coast to the west, with little drawings “like cakes.” Collected the year the ambassadors were lost.' }, { set: 'c2_map' }] },
      ], exit: 'Yes, Master Aldren.', need: 'c2_map' },
    ] },
    { id: 'mistress', at: 'mistress', talk: (f) => f.c2_bow ? [[M, 'Posture, Highness. Even when leaving.']] : !f.c2_map ? [[M, 'After Master Aldren’s lesson, Highness. One thing at a time.']] : [
      [M, 'The seven formal greetings, from the shallow bow owed to a harbor master to the full Ember Salute reserved for a foreign crown.'],
      [M, 'The ruler of another land is your equal, whether a king, a queen, a lord or the chosen leader of a free town. Begin.'],
      { c: [
        ['A quick nod.', [[M, 'That is how one greets a pastry. Again.']], 0],
        ['A shallow bow.', [[M, 'Lower.']], 0],
        ['A deep bow, held.', [[M, 'Better. Now your hands.']], 1],
      ], retry: 1 },
      { c: [
        ['Hands clasped behind.', [[M, 'And what are you hiding back there? Again.']], 0],
        ['A flame in each palm, to honour them.', [[M, 'You have just threatened a queen. Again.']], 0],
        ['Open hands, shown empty.', [[M, 'So that it is seen there is no flame in them. Yes.']], 1],
      ], retry: 1 },
      [A, 'Why am I learning to greet foreign kings and queens and lords, if no one ever comes here?'], [M, 'Posture, Highness.'], [A, 'It’s a fair question.'],
      [M, 'Etiquette is not learned for the day you know you will need it. Anyone can prepare for a guest who has sent word. It is learned for the day you did not expect. A queen who must stop and think how to be gracious has already been rude.'],
      { c: [['And if that day never comes?', [[M, 'Then you will have kept something alive that your mother knew, and the queen before her. We practise it so that it is still there when it is wanted.']]],
            ['(Hold the bow in silence.)', [[M, 'Good. Stillness is also a greeting.']]]] },
      [M, 'Besides, a person who can greet a stranger properly can usually manage to be polite to her own tutors. Again.'],
      'They did it eleven more times.', { set: 'c2_bow' },
      { lead: 'When the lessons end you always go down the west stair and out the small door, into the queen’s garden.' },
    ] },
    { id: 'ashlock', at: 'regent_desk', if: 'c2_statue', talk: (f) => f.c2_regent ? [[L, 'That will be all, Your Highness.']] : [
      'The braziers are unlit. Papers lie in rows as straight as a harbor wall. There is a smell Amber has never been able to name, faint and sweet, like flowers kept too long in a jar.',
      [L, 'The roads are under inspection.'], 'He signs a paper without looking up.',
      [A, 'I can go another way.'], [L, 'Your lessons cannot wait.'], [A, 'Ruby will be wondering where I am.'], [L, 'Your companion can look after herself.'], [A, 'I know that.'], [L, 'Then we are agreed.'],
      'He has a way of waiting before he speaks that makes other people fill the silence with apologies. Amber has been doing it since she was six.',
      { c: [
        ['I’m sorry, I only thought—', [[L, 'Naturally.'], 'The silence opens again, patient as a harbor.'], 0],
        ['(Say nothing. Wait.)', ['She does not do it now.'], 1],
      ], retry: 1 },
      [A, 'We are not agreed. You’ve said no. It isn’t the same thing.'], 'He looks up at that.',
      [A, 'Master Aldren says the old maps were collected.'], [L, 'Master Aldren is fond of old things.'], [A, 'Where are they kept?'], [L, 'Where they can do no harm.'],
      [L, 'Your Highness, I have governed in your father’s name since his illness began. In that time not one Emberian has been lost on foreign soil. Not one. Consider what it would cost this kingdom if a girl of your age were to undo it out of curiosity.'],
      [A, 'It isn’t only curiosity.'], [L, 'Then what is it?'], [A, 'I want to know if it’s true.'],
      [L, 'I wish it were not. I have wished it for years. That will be all, Your Highness.'],
      'Outside his chambers, Amber stops. She is tired of every conversation ending with a closed door.',
      { set: 'c2_regent' }, { time: 'dusk' },
    ] },
    { id: 'king', at: 'king', talk: (f) => f.c2_father ? [[F, 'You should come back. Whatever it is.']] : !f.c2_regent ? [[F, 'Lessons, little spark. I will be here.']] : [
      'He sleeps while the Fireside Memory brightens beside him. An attendant sets his night tea on the bedside table.',
      ['Attendant', 'Shall I bring His Majesty some biscuits to go with it, Highness? He ate two last night.'], [A, 'Yes, please. The ginger ones, if there are any.'],
      'She fits her hand into his, the way she had when she was small enough to need help on the stairs.',
      [F, 'Spark. Is it morning?'], [A, 'Not yet.'], [F, 'You have your mother’s frown on. What have you done?'], [A, 'Nothing. Yet.'],
      [A, 'Father, if I wanted to do something you wouldn’t like, and I thought it was right, what would you want me to do?'],
      'He is quiet so long she thinks he has slept again.',
      [F, 'Your mother asked me that, the week before she rode a half-grown dragon over the summit to prove it could be done. I told her to be sensible. She was not. I have been grateful all my life.'],
      [A, 'So I should be sensible?'], [F, 'You should come back. Whatever it is. That is all I ever minded.'],
      'The little golden flame in the lantern leans toward Amber as she stands, and goes on leaning after she has reached the door.',
      { set: 'c2_father' }, { time: 'night' },
    ] },
  ],
  things: [
    { id: 'statue', at: 'statue', label: 'Sit beneath the statue', if: (f) => f.c2_bow && !f.c2_statue, script: [
      'The sculpted queen holds a stone flame in her open palm. Fire lilies snap shut whenever a cloud crosses the sun. Someone has left a fresh candle at the statue’s feet. Someone always does.',
      [A, 'Father says you were brave. Did you ever want to know what was beyond the sea?'],
      'She draws the small curved ruby whistle from beneath her collar. It is warm against her fingers. She has not blown it in weeks.',
      { give: 'whistle' }, { codex: 'whistle' },
      [A, 'They’ve taught me how to bow to a queen I’m not allowed to meet. I can name every harbor we’ve closed. I know what to call a ship that isn’t coming.'],
      { c: [['I don’t think I can learn any more about the world without going to look at it.', []], ['Ruby would understand. Ruby understands here and not here.', [[A, 'And I have been “not here” for three weeks.']]]] },
      'A petal snaps shut somewhere behind her. The stone flame in her mother’s palm catches the last of the sun and, for a moment, looks almost lit.',
      { fade: 'The next morning' }, { time: 'day' }, { set: 'c2_statue' },
      { lead: 'To reach the Dragon Mountains you need the regent’s leave. His chambers: east side of the palace.' }] },
    { id: 'note', at: 'room_desk', label: 'Write a note', if: (f) => f.c2_father && !f.c2_note, script: [
      { cut: [{ bg: 'room' }, { amber: 'worried' },
        'The lantern on her desk burns low. Beyond the arched window, the Dragon Mountains glow against the dark.',
        [A, 'If I ask, they will say no. They always say no, and they always say it so kindly.'],
        { amber: 'fierce' }, [A, 'So I am not going to ask.'],
        { amber: 'worried' }, 'She dips the quill, and writes before she can change her mind.',
        'I am safe. I need to learn the truth for myself. I will come home.',
        'She reads it three times, thinking of her father waking without her there. Then she tucks it beneath the lantern on her desk.',
        { amber: 'smile' }, [A, 'I will come home, Father. I promise.']] },
      { set: 'c2_note' }] },
    { id: 'flask', at: 'room_flask', label: 'Water flask', prop: 'flask', if: (f) => f.c2_note && !f.p_flask, script: [{ set: 'p_flask' }, 'A water flask.', { go: 'packed' }] },
    { id: 'pbuns', at: 'room_buns', label: 'Orin’s buns', prop: 'bun', if: (f) => f.c2_note && !f.p_buns, script: [{ set: 'p_buns' }, 'Two of Master Orin’s buns, wrapped in a cloth.', { go: 'packed' }] },
    { id: 'coins', at: 'room_coins', label: 'Coin purse', prop: 'purse', if: (f) => f.c2_note && !f.p_coins, script: [{ set: 'p_coins' }, 'A purse of coins stamped with the flame, which she supposes will be worth nothing where she is going.', { go: 'packed' }] },
    { id: 'spy', at: 'room_spy', label: 'Mother’s spyglass', prop: 'spyglass', if: (f) => f.c2_note && !f.p_spy, script: [{ set: 'p_spy' }, 'Her mother’s small brass spyglass, which she was allowed to keep on the condition that she never pointed it out to sea.', { give: 'spyglass' }, { go: 'packed' }] },
    { id: 'cape', at: 'room_cape', label: 'Flying cape', if: (f) => f.p_flask && f.p_buns && f.p_coins && f.p_spy && !f.c2_end, script: [
      'Crimson, embroidered along the hem with small gold flames, and light as a breath, because nothing in Emberland needs to be heavier. She fastens it at her throat and thinks no more about it.',
      'When the bells come, she counts all twelve.', { set: 'c2_end' }] },
  ],
  scripts: { packed: [{ if: all('p_flask', 'p_buns', 'p_coins', 'p_spy'), then: [[A, 'That’s the whole plan. Now the cape.']] }] },
};

// ───────────────────────── Chapter 3 ─────────────────────────
const W1 = 'Cinderwarden', W2 = 'Second Warden';
const wardenBanter = [
  [W1, '…and my sister wants the whole watch to carry lanterns in the procession. All forty of us. In step.'],
  [W2, 'For the Festival of the First Flame? We did that two years ago. Dorrin set his own cloak alight.'],
  [W1, 'That’s why she wants it rehearsed. It’s barely two weeks off.'],
  [W2, 'I’m on harbor duty that night. Tell her I’m heartbroken.'],
];
const ch3 = {
  n: 3, title: 'Beyond the Dragon Mountains', world: 'ember', time: 'night', spawn: 'side_door',
  intro: 'Emberland did not go dark at night. It only changed color.',
  steps: [
    { goal: 'Hood up. Reach the mountain gate, north of the palace.', hint: 'Keep north past the palace walls. A baker is out late; nobody stops you.', until: 'c3_near' },
    { goal: 'Slip past the Cinderwardens.', hint: 'Wait in the shadow of the wall. Cross only while they have turned to talk to each other.', until: 'c3_gate' },
    { goal: 'Climb the familiar path to the sheltered overlook.', hint: 'Follow the seams of molten orange up the mountain, north and a little east.', until: 'c3_top' },
    { goal: 'Sound one clear note.', hint: 'The ruby whistle.', until: 'c3_ruby' },
    { goal: 'Ask her.', hint: 'Go to Ruby. Press your forehead to familiar warmth.', until: 'c3_asked' },
    { goal: 'Fly. Over the harbor, into the fog, and beyond the map.', hint: 'Follow the glowing rings. Keep your eyes on the red along Ruby’s neck.', until: 'c3_landed' },
    { goal: 'A strange forest. See that Ruby is looked after.', hint: 'Listen for water through the striped trees. Then look for shelter in the pale hill behind the lake.', until: 'c3_cave' },
    { goal: 'Step onto the path. Alone, at first.', hint: 'Leave the second bun where it will be found, then take the path north, bordered by flowers that smell like vanilla.', until: 'c3_end' },
  ],
  canWhistle: (f) => f.c3_top && !f.c3_ruby,
  whistle: (f) => f.c3_top && !f.c3_ruby ? [
    'One clear, delicate note. Something moves beyond the cliffs; the night stirs with a rush of wind.',
    { ruby: 'arrive', at: 'overlook_ruby' },
    [A, 'There you are.'],
    'Her scales are black as the mountain itself, but along her neck and shoulders and the edges of her wings run scales of deep red that hold a light of their own, brightening as she breathes in, dimming as she breathes out.',
    { set: 'c3_ruby' }] : null,
  npcs: [
    { id: 'baker', at: 'baker', talk: ['A baker hauling a tray of dough to the ovens nods, as he would to anyone who was out late.', [A, '(How simple it is to be nobody.)']] },
    { id: 'warden1', at: 'gate_w1', talk: [[W1, 'Gate’s shut for the night, miss.'], { tp: 'gate_shadow' }] },
    { id: 'warden2', at: 'gate_w2', talk: [[W2, 'Mountain roads are under inspection. Regent’s orders.'], { tp: 'gate_shadow' }] },
  ],
  ruby: (f) => f.c3_ruby && !f.c3_landed ? 'overlook_ruby' : null,
  things: [
    { id: 'near', at: 'gate_shadow', auto: 7, if: (f) => !f.c3_near, script: ['Two Cinderwardens stand beneath a lamp in their gray cloaks. Amber waits in the shadow of the wall.', { set: 'c3_near' }, { tip: 'stealth' }] },
    { id: 'cross', at: 'gate', auto: 3.2, if: (f) => f.c3_near && !f.c3_gate, script: (g) => g.tmp.watch ? [[W1, 'Who’s there?'], 'Amber shrinks back into the shadow until the lamp-light settles.', { tp: 'gate_shadow' }] : ['She slips past the edge of the lamplight and through the gate.', [A, 'Two weeks. I have never missed a First Flame, and I don’t mean to begin now.'], { set: 'c3_gate' }] },
    { id: 'top', at: 'overlook', auto: 6, if: (f) => f.c3_gate && !f.c3_top, script: ['The sheltered overlook. Below, the lava rivers are threads of light. Ahead, the black horizon.', { set: 'c3_top' }, { tip: 'whistle' }] },
    { id: 'ask', at: 'overlook_ruby', r: 6, label: 'Go to Ruby', if: (f) => f.c3_ruby && !f.c3_asked, script: [
      [A, 'I’ve missed you. I know I should have come sooner.'], [R, '(A low rumble. It is not quite forgiveness.)'], [A, 'I know. I know. Three weeks.'],
      'Through the bond she feels what she always feels first: heat, steady and enormous, and under it a question asked without words. Where were you. Are you well. Is it now.',
      [A, 'It’s now.'],
      [A, 'They tell me everyone out there hates us. But none of the people who say it have met them. I want to see for myself.'],
      { c: [
        ['It’s farther than anyone’s gone since before I was born.', [[A, 'I don’t know how long it takes, or what’s on the other side, or whether they’ll throw things at us. I’ve a flask of water and two buns. That’s the whole plan.'], [R, '(A warm breath stirs her hair.)']]],
        ['If I’m wrong, we turn round and come home.', [[A, 'And I’ll never ask again. But I have to see it. I can’t be queen of half a map.']]],
      ] },
      [A, 'Will you come?'], [R, '(A deep, reassuring sound.)'], 'Amber smiles and climbs into the place she knows by heart.',
      { set: 'c3_asked' }, { tip: 'fly' },
      { fly: { rings: [[44, 60, -112], [74, 64, -62], [104, 58, -6]], barks: { 2: [A, 'The eastern harbor. From here the merchants sailed, crew after crew. From here the ambassadors sailed after them.'] } } },
      { c: [['Take out Mother’s spyglass. Point it at the sea.', ['For the first time, she points it at the sea. The Cinderwarden ships lie at anchor across the harbor mouth with their lanterns lit, keeping the watch they have kept all her life.', [A, 'Somebody waited on that quay for every one of them. I’ll be careful.']]],
            ['Keep your eyes ahead.', [[A, 'I’ll be careful. I promise all of you.']]]] },
      { fly: { rings: [[150, 54, 20], [200, 52, 30]], fogTo: 0.05, barks: { 0: 'Beyond the last patrol ship, the sea ends. A wall of fog stands there, as it has stood all her life.', 1: [A, 'Ruby isn’t slowing. Then neither am I.'] } } },
      { fly: { world: 'sea', time: 'dawn', start: [0, 55, 0], rings: [[0, 55, -140], [30, 60, -300], [-20, 58, -470]], fog: 0.05, fogTo: 0.004, barks: { 0: 'Cold and wet and perfectly blank. The only color anywhere is the red along Ruby’s neck, brightening and dimming with her breath.', 2: 'Then the gray thins, and tears, and they fly out into a morning she has never seen from this side.' } } },
      'Somewhere over the middle of the sea the air changes. It thins and cools, and the wind finds its way under the edge of her cape.',
      [A, '(I could go back. Nobody has missed me yet. The note is still under the lantern.)'],
      { c: [['(Let the thought go by, like a cloud.)', ['The warmth beneath her does not change. The steady beat goes on.']], ['(Hold on tighter.)', ['Ruby offers no opinion. After a while the thought has gone by on its own.']]] },
      [A, 'Thank you. For not turning round when I wobbled.'], [R, '(A low hum, patient and faintly amused.)'],
      { fly: { rings: [[0, 60, -640], [40, 56, -820], [0, 50, -1000]], barks: { 1: 'The wind had carried salt for hours. Now it brings something else: warm sugar, cooler and lighter than home, mixed with something green.', 2: 'A pastel coastline. Soft green hills, pink groves, mountains capped in something that resembles cream.' } } },
      { fly: { world: 'sugar', time: 'day', start: [230, 70, 40], rings: [[160, 60, 50], [100, 52, 100], [40, 36, 138]], barks: { 0: [A, 'They don’t look as if they hate anybody.'], 1: [A, 'Not the towns. I won’t risk you, or me, or them, on a guess. The forest, over there, well away from the roofs.'] }, land: 'clearing' } },
      { ruby: 'at', at: 'clearing_ruby' },
      'The trees are strange. Smooth trunks striped red around white, cool to the touch, smelling of peppermint. Nothing here glows. She had not known how much of her world glowed until she stood in one that did not.',
      'Ruby folds her wings and lowers her head almost to the ground. The red along her neck has sunk to a dull glow.',
      [A, 'Oh, Ruby. You’re worn out.'], { set: 'c3_landed' },
      { lead: 'Through the trees comes the sound of water, somewhere west of the clearing.' }] },
    { id: 'lake', at: 'lake_shore', label: 'Taste the water', if: (f) => f.c3_landed && !f.c3_lake, script: [
      'A small lake, perfectly still, and pink from shore to shore. It smells of strawberries. She dips a finger, tastes it and laughs aloud.',
      { ruby: 'at', at: 'lake_ruby' }, 'Ruby does not wait to be invited. When she lifts her head her chin is dripping pink.', { set: 'c3_lake' },
      { lead: 'Behind the strawberry lake the ground rises into a hill of pale rock. There may be shelter there.' }] },
    { id: 'cave', at: 'cave', label: 'Dark cave', flame: 1, if: (f) => f.c3_lake && !f.c3_cave, script: [
      'She goes in first with a flame cupped in her palm. Dry and deep, high enough for a dragon to turn around in, with a floor of soft sand. Striped trees screen its mouth.',
      [A, 'Here. You can sleep here and nobody will find you. And you’ve a whole lake for when you wake.'],
      { ruby: 'at', at: 'cave_ruby' }, 'Ruby looks at the cave, and then at Amber, and does not go in.',
      [A, 'I should go alone at first. We don’t know how they’ll react. I’ll call if I need you.'],
      'A great warm weight presses once against her shoulder, nearly knocking her over, and withdraws.',
      [A, 'If they’re kind, I’ll bring them to meet you. I promise. At home everyone knows what a dragon is worth. I’d like someone here to know it too.'],
      'Ruby breathes out, a long warm sigh, and goes into the cave at last.', { set: 'c3_cave' }] },
    { id: 'bun', at: 'bun_stone', label: 'Leave the second bun', if: (f) => f.c3_cave && !f.c3_bun, script: ['She sets the second bun on a flat stone at the edge of the clearing, where it will be found.', { set: 'c3_bun' }] },
    { id: 'path', at: 'forest_path', auto: 6, if: (f) => f.c3_bun && !f.c3_end, script: [
      'A breeze comes down the path to meet her, fresh and sweet. It goes straight through her cape as though the cape were not there.',
      [A, 'Seven greetings for people I was never to meet. And all I have is my own name and a wish to be liked.'], { set: 'c3_end' }] },
  ],
  tick(g, dt) {
    const f = g.f; if (!f.c3_near || f.c3_gate) { g.tmp.watch = true; return; }
    const T = (g.tmp.gt = (g.tmp.gt || 0) + dt), ph = T % 9;
    const talking = ph > 5.2; g.tmp.watch = !talking;
    const a = g.npc('warden1'), b = g.npc('warden2'); if (!a || !b) return;
    if (talking) { a.face(b.x, b.z); b.face(a.x, a.z); } else { a.face(a.x - 2, a.z + 10); b.face(b.x + 2, b.z + 10); }
    if (talking && !g.tmp.wasTalk) { const i = (g.tmp.wi = ((g.tmp.wi ?? -1) + 1) % wardenBanter.length); g.bark(wardenBanter[i]); }
    g.tmp.wasTalk = talking;
  },
};

// ───────────────────────── Chapter 4 ─────────────────────────
const P = 'Madame Praline';
const ch4 = {
  n: 4, title: 'A Stranger in Sugarland', world: 'sugar', time: 'day', spawn: 'forest_path',
  intro: 'The first thing Amber learned about Sugarland was that its signposts were not always helpful.',
  meter: (f) => f.coat ? null : 'cold',
  companion: (f) => f.c4_kim && !f.c4_night ? 'kim' : null,
  ruby: (f) => f.c4_night ? 'cave_ruby' : null,
  steps: [
    { goal: 'Follow the path north out of the forest.', hint: 'The vanilla flowers lead toward pale rooftops.', until: 'c4_town' },
    { goal: 'You are shivering. Keep moving.', hint: 'Walk on into the town. A shop window full of coats stands on the west side of the lane.', until: 'coat' },
    { goal: 'Go back to the lollipop signpost and try again.', hint: 'The signpost stands where the forest path meets the town.', until: 'c4_kim' },
    { goal: 'Let Kim show you the Confectioners’ Market.', hint: 'Try a tart, see the fountain that smells of strawberry syrup, and look in on the balloon meadow. Kim will talk if you ask her.', until: 'c4_tour' },
    { goal: 'Sunset. Say good night to Kim.', hint: 'She is right beside you.', until: 'c4_night' },
    { goal: 'Ruby has been alone all afternoon.', hint: 'Not the inn. South, down the forest path, to the cave behind the pink lake.', until: 'c4_end' },
  ],
  npcs: [
    { id: 'praline', at: 'praline', talk: (f) => f.coat ? [[P, 'Still cold?'], { c: [['Not any more.', [[P, 'Then keep it a while longer.']]], ['How can I repay you?', [[P, 'You can’t pay Praline, child. People have tried for years.']]]] }] : [{ go: 'coat' }] },
    { id: 'mint', at: 'mint', talk: [['Pastry Carrier', 'Mind the signposts, dear. The lollipop one is sulking again.']] },
    { id: 'ribbon', at: 'ribbon', talk: [['Ribbon Merchant', 'Ribbons! Lavender, lime, the blue from the heart of a candle flame!'], [A, '(A blue I have only ever seen in the heart of a candle. He has it by the yard.)']] },
    { id: 'kid1', at: 'kids', talk: [['Sugarland Child', 'Your hair is the colour of toffee! Is that allowed?']] },
    { id: 'kim', at: 'signpost_kim', if: (f) => f.coat && !f.c4_kim, talk: [{ go: 'meetKim' }] },
    { id: 'tartman', at: 'tart', talk: (f) => !f.c4_kim ? [['Confectioner', 'Lemon tarts! Tiny, sharp, and gone in a blink!']] : f.c4_tart ? [['Confectioner', 'The best you’ve ever had, wasn’t it? You may tell me again.']] : [
      'A confectioner offers Amber a tiny lemon tart. She reaches for a coin — Emberian gold, stamped with a small flame — and quickly withdraws it.',
      [K, 'Traveling from far away?'], [A, 'Very far.'], [K, 'Then the tart is on me. You can repay me by telling me whether it’s the best you’ve ever had.'],
      { c: [['It might be.', [[K, 'That means you haven’t tried my mother’s.']]], ['It is the best.', [[K, 'Then you definitely haven’t tried my mother’s.']]]] },
      { set: 'c4_tart' }, { go: 'tour' }] },
  ],
  things: [
    { id: 'town', at: 'signpost', auto: 7, if: (f) => !f.c4_town, script: [
      'One sign points toward the Peppermint Quarter. Another toward Sweetlake. A third, shaped like a lollipop, points back the way she came.',
      'Amber turns the post, then turns herself, then admits she is thoroughly lost.',
      'The second thing she learns is that Sugarland is cold. The people here walk about with bare arms. She pulls her thin cape around her and finds it makes no difference at all.',
      { set: 'c4_town' }] },
    { id: 'pcall', at: 'praline', auto: 9, if: (f) => f.c4_town && !f.coat, script: [{ go: 'coat' }] },
    { id: 'sign', at: 'signpost', label: 'Read the signpost', script: (g) => g.f.c4_kim ? ['Peppermint Quarter. Sweetlake. And the lollipop, which points wherever it likes.'] : ['She turns the post. Then herself. No.'] },
    { id: 'fountain', at: 'fountain', label: 'The fountain', if: (f) => f.c4_kim && !f.c4_fountain, script: ['Amber tries not to stare at a fountain that smells of strawberry syrup.', [A, 'Is everything here sweet?'], [K, 'Not everything. We have pickles.'], 'Amber laughs so suddenly that Tira startles.', { set: 'c4_fountain' }, { go: 'tour' }] },
    { id: 'meadowgate', at: 'balloon_gate', label: 'Look over the launch meadow', if: (f) => f.c4_kim && !f.c4_gate, script: [
      [K, 'The launch meadow for macaron balloons. That way is Chocolate Lake, and out east the marshmallow fields.'],
      [A, 'Is it always this cool?'], [K, 'Cool? This is a lovely day. It’s the Sweet Breeze. It comes down from the Ice Cream Mountains every morning and goes out to sea every night. Grandma Lava says the whole kingdom would go soft without it.'],
      [K, 'Is it warmer where you come from?'], [A, 'A little.'], 'Which was the smallest true thing she could find.', { set: 'c4_gate' },
      { lead: 'Kim: Chocolate Lake lies west of town; the marshmallow fields east; the Ice Cream Mountains north, where the Sweet Breeze begins.' }, { go: 'tour' }] },
    { id: 'kimnight', at: 'player', label: 'Talk to Kim', kimTalk: 1, if: (f) => f.c4_tour && !f.c4_night, script: [
      [K, 'Have you somewhere to stay?'],
      'She could hardly say that she meant to sleep in a cave.',
      { c: [['There’s an inn. The one with the gingerbread shutters.', [[K, 'The Sugar Plum? That’s a good one. Ask for the room over the bakery. It’s the warmest. Not that you’ll need it now.']]],
            ['I passed an inn near the lollipop signpost.', [[K, 'The Sugar Plum! Ask for the room over the bakery.']]]] },
      'It was the first lie Amber had told in Sugarland, and she did not like how easily it had come.',
      [K, 'Then tomorrow, I’ll show you the places tourists miss.'], [A, 'Why would you do that for a stranger?'],
      [K, 'Because you seem nice. Is that a strange reason where you come from?'], [A, 'Apparently.'], [K, 'Well. You’re in Sugarland now.'],
      { set: 'c4_night' }, { time: 'dusk' },
      { lead: 'The cave: south down the forest path, west past the pink lake, in the pale hill behind the striped trees.' }] },
    { id: 'kimchat', at: 'player', label: 'Talk to Kim', kimTalk: 1, if: (f) => f.c4_kim && !f.c4_tour, script: [{ hub: [
      { q: 'Where should we go?', a: [[K, 'The tart stall in the middle of the market, the syrup fountain just south of it, and the fence by the balloon meadow to the west. Any order you like. I’m the guide; you’re the feet.']] },
      { q: 'Who is Tira?', a: [[K, 'She considers herself in charge of introductions. And pastries. And me.']] },
      { q: 'Madame Praline gave me this coat.', a: [[K, 'She decides who’s cold, and that’s the end of it. She gave my father a scarf once and he still isn’t sure what he did.']] },
    ], exit: 'Lead on.' }] },
    { id: 'ruby4', at: 'cave_ruby', r: 7, label: 'Ruby', if: (f) => f.c4_night && !f.c4_end, script: [
      'For one bad moment the mouth of the cave is only dark. Then two points of red open in it, and a glow runs up Ruby’s neck like a fire catching.',
      [A, 'It’s me. I’m sorry. I was so long.'],
      'Ruby takes her time over the coat. She sniffs the whipped-cream collar, sneezes a small spark and looks at Amber as if an explanation were owed.',
      [A, 'A woman gave it to me. For nothing. Because I was cold. Nobody ran, Ruby. Nobody even stared very hard. I asked for directions and they gave me cake.'],
      [R, '(A long, thoughtful rumble.)'], [A, 'I know. It’s only one day. They don’t know what I am yet. But I think we may have been wrong about them.'],
      'Ruby eats four tarts, bag and all, and lowers her head across Amber’s knees.',
      [A, 'I’ll come back every night. I promise. I’m not leaving you alone in the dark in a country made of pudding.'], { set: 'c4_end' }] },
  ],
  scripts: {
    coat: [
      [P, 'Oh, no, no. That won’t do at all. You’re shivering, child.'], [A, 'I’m quite all right.'], 'Amber said, shivering.',
      [P, 'You’re blue at the edges. Where have you come from, dressed for a bonfire? Arms out.'],
      'Amber was a princess, and had been dressed by other people all her life. Her arms went out before she had decided anything.',
      { set: 'coat' }, { codex: 'coat' },
      'The coat settles over her shoulders like a warm loaf. The cold stops. It simply stops, as if a door had been shut.',
      [P, 'There. It wanted somebody tall.'],
      { c: [['It’s beautiful. How much is it?', [[P, 'Did I say it was for sale?'], [A, 'But it’s your shop.'], [P, 'And it’s my coat, so I may do as I like with it. I’ve had that one in the window for two winters. You’d be doing me a kindness.']]],
            ['I can’t just take it.', [[P, 'Then borrow it till you’re warm, and if that turns out to be a long time, well.']]]] },
      [P, 'Madame Praline. In case anyone asks who’s been dressing you.'], [A, 'Amber.'], [P, 'Well, Amber. Welcome to Sugarland. Mind the signposts. They’re dreadful.'],
      'The regent had told her that the people beyond the sea would hate her on sight. The first one to speak to her had looked at her for the space of a breath and given her a coat.',
    ],
    meetKim: [
      [K, 'You’re reading that upside down.'],
      'A girl stands beside a cart piled with boxes tied in lavender ribbon. Strawberry-pink hair, a dress that looks good enough to eat, short white lace gloves tied at each wrist with a bow. A tiny cocoa-and-cream creature peers out of her bag.',
      [A, 'Am I?'], [K, 'Only if you wanted the Confectioners’ Market. Otherwise you’re doing wonderfully.'],
      { c: [['I wanted the market.', []], ['I wanted anywhere, honestly.', [[K, 'Then the market. Everyone wants the market eventually.']]]] },
      [K, 'Then you’ve found your guide. I’m Kimbrûlée. Kim, to anyone who isn’t cross with me.'], [A, 'Amber.'],
      [K, 'And this is Tira. She considers herself in charge of introductions.'],
      [K, 'That’s one of Madame Praline’s coats.'], [A, 'She gave it to me. I tried to pay.'], [K, 'You can’t pay Praline. She must have liked you.'],
      { set: 'c4_kim' }, { lead: 'Kim will show you the market: north of the signpost. Ask her where to go.' },
    ],
    tour: [{ if: all('c4_tart', 'c4_fountain', 'c4_gate'), then: ['Beneath the fantastical details are ordinary people carrying groceries, arguing over prices, greeting neighbors, and calling children home.', { set: 'c4_tour' }] }],
  },
};

// ───────────────────────── Chapter 5 ─────────────────────────
const three = [{ if: all('c5_meadow', 'c5_sled', 'c5_lake'), then: [[K, 'Tomorrow is the best day. Meet me at the balloon field behind the market.'], { set: 'c5_three' }, { lead: 'The balloons go up from the field west of the market, a dozen at a time.' }] }];
const ch5 = {
  n: 5, title: 'A World Made of Sweetness', world: 'sugar', time: 'day', spawn: 'signpost',
  intro: 'Kim had a talent for turning an ordinary day into an expedition.',
  companion: (f) => f.c5_start && !f.c5_night ? 'kim' : null,
  ruby: (f) => f.c5_night ? 'cave_ruby' : null,
  steps: [
    { goal: 'Meet Kim at the lollipop signpost.', hint: 'She is waiting with Tira.', until: 'c5_start' },
    { goal: 'Three expeditions, in any order: the Meadows, the Mountains, Sweetlake.', hint: 'Meadows: east of town; bounce up to the sprite. Mountains: north; ride the licorice basket. Sweetlake: north-east; the walnut boats. Ask Kim.', until: 'c5_three' },
    { goal: 'The best day: the balloon flight.', hint: 'The balloonist waits in the meadow west of the market.', until: 'c5_balloon' },
    { goal: 'Kim is bringing you home for supper.', hint: 'The house stands behind the family workshop, east of the market: the roof with the crooked chimney.', until: 'c5_supper' },
    { goal: 'Walk back to the signpost and say good night.', hint: 'South of the market.', until: 'c5_night' },
    { goal: 'Turn, as you do every night, and take the forest path.', hint: 'A parcel of Tafford’s pastries for Ruby.', until: 'c5_end' },
  ],
  npcs: [
    { id: 'kim', at: 'signpost_kim', if: (f) => !f.c5_start, talk: [
      { cut: [{ bg: 'sugar' }, { kim: 'laugh' }, { amber: 'smile' },
        [K, 'There you are! I have been planning since breakfast.'],
        [A, 'Planning what?'],
        { kim: 'amazed' }, [K, 'Everything. You have seen one street of Sugarland. One! That is hardly a visit.'],
        { amber: 'laugh' }, [A, 'Then show me the rest of it.'],
        { kim: 'smile' }, [K, 'Marshmallow Meadows first, I think. Nobody can be serious there, and you look as though you need the practice.']] },
      { c: [['I’m perfectly able to be unserious.', [[K, 'We’ll see.']]], ['Where else?', [[K, 'The Ice Cream Mountains take a whole day. And if it rains, Sweetlake.']]]] },
      { set: 'c5_start' },
      { lead: 'Meadows: east along the lane edged with sugar-daisies. Mountains: north to the licorice basket. Sweetlake: north-east of the market.' }] },
    { id: 'praline', at: 'praline', talk: [[P, 'Collar up in the mountains, child. That fluff is not for show.']] },
    { id: 'tartman', at: 'tart', talk: [['Confectioner', 'Back again! Kim’s friend eats like a visitor and tips like a local: with compliments.']] },
    { id: 'sledlady', at: 'summit_sled', talk: (f) => f.c5_sled ? [['Sled Keeper', 'The mountain decided, did it? It always does.']] : [
      'The peaks come in three colors: white, pale brown, and soft pink, each with a glossy cap Kim says is only frozen syrup and not to be trusted for standing on.',
      ['Sled Keeper', 'Waffle sleds! Round, crisp, and curved at the edges.'],
      [A, 'How do I steer?'], ['Sled Keeper', 'You lean.'], [A, 'And how do I stop?'], ['Sled Keeper', 'You don’t, really. The mountain decides.'],
      { mini: 'sled' },
      'Amber leans the wrong way, spins twice and crashes into a drift of vanilla snow, where she declares herself defeated by dessert. Tira, safely tucked in Kim’s satchel, seems unimpressed.',
      [A, 'Aren’t you freezing?'], [K, 'Should I be? It’s vanilla.'], [A, 'I can’t feel my nose.'], [K, 'You’re a very strange sort of person.'],
      'A man selling hot cider from a sled fills a cup without being asked and puts it into Amber’s hands. When she feels for her purse he is already sliding away down the slope, waving.',
      [A, 'Does everyone here do that? Give things to people they don’t know.'],
      [K, 'He could see you were cold. What else was he supposed to do?'],
      { set: 'c5_sled' }, ...three] },
    { id: 'cider', at: 'lift_cider', talk: [['Cider Seller', 'Hot cider! Warms the nose first, then the toes, then the opinions.']] },
    { id: 'balloonist', at: 'balloon', talk: (f) => !f.c5_three ? [['Balloonist', 'No flights till the wind’s combed out. Come back another day.']] : f.c5_balloon ? [['Balloonist', 'Most visitors squeak. You didn’t squeak.']] : [
      'The balloons go up a dozen at a time, each an enormous puff of cotton candy tethered over a basket. Kim chooses one shaped like a lavender macaron.',
      ['Balloonist', 'Are you afraid of heights?'], [A, 'No.'], 'With perfect truth.', ['Balloonist', 'Good. Most visitors squeak.'],
      { mini: 'balloon', script: [
        'They rise so gently that she does not feel the ground let go. The market shrinks to a scatter of bright awnings. The lanes become threads.',
        'Amber finds the forest she knows without meaning to look for it: a dark stripe of red and white, a pale hill, a pink coin of water. No red glow shows between the trees. She lets out a breath.',
        [K, 'There’s the workshop. The roof with the crooked chimney. And that’s Madame Praline’s, and the lake, and if you lean out, which you shouldn’t, you can see the sea.'],
        'Beyond the pale line of the shore the water goes on until it meets the sky. Somewhere past that is a harbor guarded by ships, and a map that stops at the coast.',
        [A, 'It looks so small from up here.'], [K, 'The sea?'], [A, 'The distance.'],
        [A, 'Have you ever met someone from another kingdom?'], [K, 'Not that I know of. Grandma Lava tells stories about lands beyond the sea. I always hoped they were real.'],
        { c: [['Even the frightening stories?', [[K, 'A story can be frightening without everyone in it being cruel.']]], ['What if they were real, and nearer than you think?', [[K, 'Then I’d want to meet them before deciding anything. Wouldn’t you?']]]] },
      ] },
      { set: 'c5_balloon' }, [K, 'Now you’re coming home with me. Mum has been asking for days.'],
      { lead: 'Kim’s house is behind the workshop with the crooked chimney, east of the market.' }] },
    { id: 'smorella', at: 'house_s', if: 'c5_balloon', talk: (f) => f.c5_supper ? [['Smorella', 'Then you must tell us about it sometime, dear. No hurry.']] : [
      'Smorella greets Amber with flour on her sleeve and an immediate invitation to supper. Tafford appears carrying a tray of warm pastries.',
      ['Tafford', 'Has Kim already shown our guest every hill in the kingdom?'], [K, 'Only the interesting ones.'], ['Tafford', 'Then there can’t be many left.'],
      'Smorella reaches to take Amber’s coat and stops with her hand on the collar.',
      ['Smorella', 'Praline’s work. I’d know that piping anywhere. And no wonder. You’re like ice. Keep it on, dear, and sit there, by the oven. Tafford, move your feet.'],
      ['Tafford', 'I always sit by the oven.'], ['Smorella', 'You’re not cold.'], ['Tafford', 'I might be. Nobody’s asked.'],
      'Across the table Kim is reaching for the cinnamon, her lace gloves dusted with flour to the knuckles. She never seems to take them off, even to eat.',
      'Laughter, overlapping conversation, an argument about the correct amount of cinnamon. Amber feels a sudden ache for the evenings she once shared with her father.',
      ['Smorella', 'Are you missing home, dear?'],
      { c: [['A little.', [['Smorella', 'Then you must tell us about it sometime.']]], ['(Look down at your plate.)', [['Smorella', 'Whenever you like, dear. Have another.']]]] },
      'She wanted to. She was simply not ready.', { set: 'c5_supper' }, { time: 'night' }] },
    { id: 'tafford', at: 'house_t', if: 'c5_balloon', talk: [['Tafford', 'Cinnamon is a question of courage. Smorella says it is a question of measuring. We have agreed to keep arguing.']] },
  ],
  things: [
    { id: 'kimchat', at: 'player', label: 'Talk to Kim', kimTalk: 1, if: (f) => f.c5_start && !f.c5_supper, script: [{ hub: [
      { q: 'Which way to the Meadows?', a: [[K, 'East, where the lane ends. The ground trembles. That’s how you know.']] },
      { q: 'And the Ice Cream Mountains?', a: [[K, 'North. There’s a basket on a rope of twisted licorice. It swings alarmingly at every post. You’ll love it.']] },
      { q: 'Sweetlake?', a: [[K, 'North-east of the market. The boats are halved walnut shells with floors of sugar-glass.']] },
      { q: 'You’ve stopped asking where I’m from.', a: [[K, 'You go quiet whenever I ask. So I thought I’d let you ask me things instead.']] },
    ], exit: 'Come on.' }] },
    { id: 'meadow', at: 'meadows', auto: 14, if: (f) => f.c5_start && !f.c5_meadowIn, script: [
      'Wide, soft mounds, white and pale pink and the faintest yellow, rolling away like bedclothes somebody has shaken out. The ground itself trembles underfoot.',
      [K, 'Come on, Amber! It’s easy!'], [A, 'Easy? Where I’m from, the ground stays where you put your feet.'], [K, 'Well, that sounds terribly boring.'], [A, 'It’s called being sensible.'],
      'Something small and white darts between them. Boing! A tiny creature with enormous pointy ears and shimmering wings springs from one marshmallow to another.',
      [A, 'What in the Everlands is that?'], [K, 'A Bonbon Sprite! I think she wants to teach you.'],
      [A, 'Well, if someone that tiny can do it… But no somersaults. At least not today.'],
      { set: 'c5_meadowIn' }, { tip: 'bounce' },
      { lead: 'The sprite is waiting on the tallest mound. Bounce from the low mounds to the high ones — bend your knees.' }] },
    { id: 'sprite', at: 'mound_top', auto: 3.5, high: 1, if: (f) => f.c5_meadowIn && !f.c5_meadow, script: [
      'The sprite squeaks with approval. Tira, who had watched all this with the expression of a creature who had seen better, comes wriggling out of the bag — and the two of them roll down the slope together in a single squeaking ball.',
      [K, 'She never plays with anyone. She thinks it’s beneath her.'], [A, 'Perhaps she’s never been asked properly.'],
      [K, 'You’ve stopped looking over your shoulder.'], [A, 'Was I?'], [K, 'All yesterday. As if someone was going to come and tell you off.'], [A, 'Someone usually does.'],
      { set: 'c5_meadow' }, ...three] },
    { id: 'lift', at: 'lift', label: 'Ride the licorice basket', if: (f) => f.c5_start && !f.c5_sled, script: [{ fade: 'The basket swings alarmingly at every post.' }, { tp: 'summit' }, [K, 'It’s colder still up here. The Sweet Breeze begins among these peaks.'], 'Amber turns up the whipped-cream collar until it covers her ears.'] },
    { id: 'boat', at: 'boat', label: 'Take a walnut boat', if: (f) => f.c5_start && !f.c5_lake, script: [
      { fade: 'A fine sweet drizzle, that left everything shining' },
      'They lie on their stomachs and look straight down through the sugar-glass. Fish no bigger than her thumb, striped and spotted, come up in crowds to look back.',
      [K, 'They think you’re a new kind of cloud.'], [A, 'What do you do here in winter?'], [K, 'This is winter.'], [A, 'Then what is summer?'], [K, 'Much the same, with more ice cream.'],
      [K, 'Is it very different, where you’re from? You go quiet whenever I ask.'],
      { c: [['It’s warmer. And nothing is this color.', []], ['We have beautiful things too. Just beautiful in a different way.', []]] },
      [A, 'I’d like to show you, one day.'], 'She had said it before she thought. Kim only smiles, as if it were the most natural offer in the world.', [K, 'I’d like that.'],
      { set: 'c5_lake' }, ...three] },
    { id: 'night', at: 'signpost', auto: 6, if: (f) => f.c5_supper && !f.c5_night, script: [
      'On the way back Kim asks no more questions. She points out the first stars and tells Amber which ones she uses to find her way home.',
      [K, 'Good night, Amber.'], 'Amber walks toward the Sugar Plum Inn until Kim’s lantern is out of sight. Then she turns.', { set: 'c5_night' }] },
    { id: 'ruby5', at: 'cave_ruby', r: 7, label: 'Ruby', if: (f) => f.c5_night && !f.c5_end, script: [
      'She counts the days on her fingers, leaning against a warm red flank. Five have gone by. The Festival of the First Flame is still a little more than a week away.',
      [A, 'A few more days. I haven’t found out enough yet.'],
      'Ruby, who has discovered that the strawberry lake is full of slow pink fish, raises no objection.',
      'Kim had offered friendship without demanding a history in return. Perhaps, Amber thought, she could learn to trust that kindness.', { set: 'c5_end' }] },
  ],
};

export default [ch1, ch2, ch3, ch4, ch5];
