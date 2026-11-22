// Chapters 12–17 and the free-roam epilogue.
const A = 'Amber', K = 'Kim', R = 'Ruby', F = 'The King', L = 'Lord Ashlock', SM = 'Smorella', TF = 'Tafford', P = 'Madame Praline', O = 'Master Orin', ST = 'The Steward', LT = 'Lamp-tender';
const all = (...fl) => (f) => fl.every((x) => f[x]);

// ───────────────────────── Chapter 12 ─────────────────────────
const ch12 = {
  n: 12, title: 'The Truth Beneath the Crown', world: 'ember', time: 'dusk', spawn: 'terrace',
  intro: 'A castle where dragons could land outside someone’s bedroom.',
  companion: (f) => f.c12_end ? null : 'kim',
  ruby: (f) => f.c12_thanks ? null : 'terrace_ruby',
  steps: [
    { goal: 'Catch your breath. Kim is staring at the furniture.', hint: 'The carved black chairs by the table on the terrace.', until: 'c12_chair' },
    { goal: 'Thank Ruby.', hint: 'She is resting near the edge of the terrace.', until: 'c12_thanks' },
    { goal: 'Find Father.', hint: 'Down from your tower and east, to the king’s chamber north of the courtyard.', until: 'c12_end' },
  ],
  npcs: [
    { id: 'king', at: 'king', talk: (f) => !f.c12_thanks ? null : f.c12_end ? [[F, 'The ambassadors… what a tragedy.']] : [
      'They find the king in bed, pale and struggling to sit upright.',
      [A, 'Father, I went away. I met people in Sugarland. They were kind, all of them, and I brought Kim, and the Cinderwardens attacked our boat. The regent has lied to us.'],
      [F, 'Slowly, little spark. You’re safe?'], [A, 'Ruby saved us. This is my friend Kim.'],
      'Kim has no idea how one greets a king. She curtsies the way she does to customers.',
      [K, 'I’m sorry we haven’t brought you anything. We had a whole boat of presents. It sank.'],
      'A small cocoa-and-cream head rises out of the pouch and regards the king with deep suspicion.',
      [K, 'And this is Tira. She considers herself in charge of introductions. She’s late.'],
      'Something happens to the king’s face that has not happened in a long while. He laughs.',
      [F, 'The first visitor since my daughter could walk. And she apologizes. For coming empty-handed.'],
      [A, 'She isn’t empty-handed.'], 'She unfastens the two red cherries, takes off the coat and lays it across his blanket.', { set: 'coatOff' },
      [A, 'Feel this. A woman I had never met put it on me in the street because I was cold. She wouldn’t take a coin. They are all like that, Father. Every one I met.'],
      'The king spreads his thin fingers on the white collar. He does not say anything for some time.',
      [A, 'There’s more. Please look at Kim’s bracelet.'],
      [K, 'Amber, there must be thousands of families in Emberland. How could he know mine?'], [A, 'I don’t know that he will. Please. Let him look.'],
      'The king holds the Flame Stone close to the window. His fingers tremble as he turns it.',
      [F, 'The ambassadors. I knew this mark. What a tragedy.'], [K, 'What ambassadors? What does he mean?'],
      [A, 'Years ago, my father sent two ambassadors across the sea. A husband and wife. They were the last Emberians ever allowed to leave. Their ship never arrived. It is the reason our harbors were closed.'],
      [K, 'And this was their mark. The birds. Then they were my parents. The people who put me in the cradle. And they’re dead.'],
      [A, 'I think so. I’m so sorry, Kim.'], [K, 'Attacked by whom?'], [A, 'We were always told it was foreigners. After today, I don’t believe that any more.'],
      [K, 'You knew. You thought this might be theirs.'],
      { c: [['I wondered, when I first saw the birds. I wasn’t sure.', []], ['I was afraid of being wrong.', []]] },
      [K, 'You could have told me.'], 'Kim steps backward, pain crossing her face.', [K, 'I need a moment.'], 'She leaves before Amber can answer.', { set: 'c12_end' }] },
  ],
  things: [
    { id: 'chair', at: 'terrace_chair', label: 'The obsidian chairs', if: (f) => !f.c12_chair, script: [
      'At her hip the pouch wriggles. Tira’s head comes out, takes in the dragon, the lava and the drop beyond the railing, and goes back in.',
      [K, 'Is this obsidian?'], [A, 'Most of the furniture on our dragon terraces is.'], [K, 'Are they comfortable?'], [A, 'Not particularly.'], [K, 'Then why would anyone want to sit on them?'],
      [A, 'Because ordinary furniture would end up halfway across the kingdom every time she landed.'], [K, 'Oh.'], [K, 'Your whole castle was built for them.'],
      [A, 'Of course. It wouldn’t make much sense to build a royal castle they couldn’t visit.'], { set: 'c12_chair' }] },
    { id: 'thanks', at: 'terrace_ruby', r: 7, label: 'Ruby', if: (f) => f.c12_chair && !f.c12_thanks, script: [
      [A, 'Thank you, Ruby. I don’t know what we would have done without you.'], [K, 'Thank you for saving me too, Ruby.'],
      [A, 'I have to find Father. But I’ll call you if I need you, all right? Go on. I’ll be all right.'],
      'Kim instinctively glances toward the obsidian chairs.', [K, 'Ah. Now I understand the furniture.'],
      { ruby: 'leave' }, 'With one powerful beat of her wings Ruby rises above the terrace. The heavy stone furniture doesn’t move an inch.', { set: 'c12_thanks' }] },
  ],
};

// ───────────────────────── Chapter 13 (play as Kim) ─────────────────────────
const torchDone = [{ if: all('t1', 't2', 't3', 't4'), then: [
  'On her wrist the Flame Stone has begun to glow, each of its colors in turn, as though something inside it had been waiting a long time to be asked.',
  'It was not like lifting a weight. It was like the moment in kneading when the dough stops fighting and begins to follow the hands.',
  [K, 'Dad says I have a way with a stove.'], 'She laughs, and finds she is crying as well.',
  { fade: 'She was seven, and a girl at the market had said that babies who came in on the tide had been thrown away' },
  'Smorella had put down her rolling pin. She did not do that for small things.',
  [SM, 'Nobody puts a child in a golden cradle to be rid of her. Whoever they were, they wrapped you up like the best thing they owned. I think about them, you know. I think, somebody is missing her. I hope they know she’s loved.'],
  ['Little Kim', 'Don’t you mind? That I had another mother first?'],
  [SM, 'Mind? Sweetheart, she and I are the only two people in the world who know exactly how much you’re worth. I’d like to have met her. We’d have had a great deal to say.'],
  { fade: '' },
  'Her heart was not a room with only two places in it.',
  { c: [['“I can love you all.”', []]] }, 'The torch beside her brightens gently, as if answering.',
  { set: 'c13_fire' }, { lead: 'Amber is with the king. Every corridor looks like the last — ask someone the way.' }] }];
const torch = (id, pt) => ({ id, at: pt, label: 'Lift your hand', flame: 1, lit: id, if: (f) => f.c13_window && !f[id], script: [{ set: id }, 'The flame lifts with her hand.', ...torchDone] });
const ch13 = {
  n: 13, title: 'The Fire Within', world: 'ember', time: 'dusk', spawn: 'pillar', as: 'kim',
  intro: 'Kim walked without knowing where she was going.',
  meter: (f) => f.c13_water ? null : 'heat',
  steps: [
    { goal: 'Walk. It doesn’t matter where.', hint: 'Along the arcade, away from the king’s chamber.', until: 'c13_lost' },
    { goal: 'For the first time in your life, you are too hot.', hint: 'Someone is up a ladder, trimming a wall lamp with her bare fingers.', until: 'c13_water' },
    { goal: '“Left at the long window, when you’re ready.”', hint: 'The air is better there.', until: 'c13_window' },
    { goal: 'The torches leapt. Lift your hand.', hint: 'Four torches along the arcade. Stand near each and hold your flame.', until: 'c13_fire' },
    { goal: 'Find Amber.', hint: 'A boy carrying linens knows the short way. Then: the pillar outside the king’s door.', until: 'c13_end' },
  ],
  npcs: [
    { id: 'tender', at: 'ladder', talk: (f) => f.c13_water ? [[LT, 'Left at the long window. The air’s better there.']] : [
      'A broad, gray-haired woman is pinching a lamp flame smaller as easily as Kim might pinch a crust. Her eyes go to the strawberry hair and the ruffled skirt, and stay there.',
      'Kim has been in Emberland for less than an hour. In that time its soldiers have sunk her boat. She takes a step back.',
      [LT, 'You’ll be the one who came with the princess. From over the water.'], [K, 'Yes. I’m sorry. I don’t know where I’m allowed to be.'],
      [LT, 'You’re red as a coal, girl. Has nobody given you water?'], [K, 'I… no.'],
      [LT, 'Years and years I’ve heard that outsiders can’t bear the sight of us, and the first one I meet is left to cook in a corridor. Sit. Slowly. It’s from the deep cistern. It’s the only cold thing in the palace.'],
      { set: 'c13_water' }, 'It is the best water she has ever tasted. Tira laps a little from her palm, sneezes, and looks at the lamp-tender with something close to approval.',
      [K, 'Thank you. In Sugarland someone gave Amber a coat. Because she was cold.'], [LT, 'Did they. Well. That’s manners.'],
      [LT, 'That’s a birth stone you’re wearing. Then you’re not from over the water at all. Not to begin with. Somebody here shaped that for you with their own two hands. You’d best find out who.'],
      [K, 'I think I just did.'], 'The woman does not ask. She refills the cup and goes back up her ladder.',
      [LT, 'Left at the long window, when you’re ready. The air’s better there.'], { lead: 'Lamp-tender: “Left at the long window.”' }] },
    { id: 'linen', at: 'linen', if: 'c13_fire', talk: ['A boy carrying linens points the way without being asked, staring at her hair.', ['Linen Boy', 'The king’s rooms? Back along the arcade and west. The stairs on the left are shorter! Wait by the big pillar if the regent’s in there. Everybody does.'], { lead: 'Linen boy: back along the arcade, then west to the big pillar outside the king’s door.' }] },
  ],
  things: [
    { id: 'lost', at: 't1', auto: 9, if: (f) => !f.c13_lost, script: [
      { cut: [{ bg: 'balcony' }, { kim: 'shy' },
        'Warmth comes up through the soles of her boots and out of the walls. She pulls off her other glove, pushes both into her pouch beside Tira, who is panting, and goes on bare-handed, with the bracelet swinging loose on her wrist.',
        [K, 'Everything here is warm. Even the stone is warm.'],
        [K, 'I don’t know where I’m going, Tira. I’m not certain I know where I have come from, either.'],
        { kim: 'amazed' }, 'Below the arcade, the lamps of Emberland are being lit, one street at a time, until the whole valley glows.',
        { kim: 'smile' }, [K, 'It is beautiful, though. Nobody told me it would be beautiful.']] },
      { set: 'c13_lost' }] },
    { id: 'window', at: 'long_window', label: 'Lean on the warm sill', if: (f) => f.c13_water && !f.c13_window, script: [
      'Roofs of red tile step down toward a harbor, and between them run thin bright streams of lava, crossed by little bridges. A child runs with a ribbon of flame trailing behind like a kite.',
      'It does not look like a place that sinks boats. It looks like somewhere she would have wanted to visit.',
      { c: [['She had been born down there. “The one with the blue door, perhaps.”', []], ['“Or the tall one with a garden on its roof.”', []]] },
      'Her first mother had shut that lid over her and let go. What kind of morning had it been, that letting go was the safest thing she could do?',
      [K, 'Why? Why would anyone hurt them?'], { fx: 'torches' }, 'Anger rises so sharply she stops breathing. The torches along the corridor leap higher. One bends toward her as though listening.',
      [K, 'Oh.'], { set: 'c13_window' }, { tip: 'flame' }] },
    torch('t1', 't1'), torch('t2', 't2'), torch('t3', 't3'), torch('t4', 't4'),
    { id: 'pillar', at: 'pillar', auto: 4, if: (f) => f.c13_fire && !f.c13_end, script: [
      'Voices reach her before she arrives.', [L, 'You should be resting, Your Majesty.'], [A, 'And you should be answering my questions.'],
      'She had imagined someone enormous. He is a narrow man in gray, with ink on his fingers and a quiet, reasonable voice, and that is worse. He sounds like someone explaining why the shop is shut.',
      'One of the guards has noticed her. Kim puts a finger to her lips. After a moment, very slightly, he looks the other way.',
      'Her fingers, stroking Tira’s ears, meet something small and cool and smooth. A little glass bottle, stoppered with wax. The dust her mother packed.',
      'Her mother had prepared for a danger Kim had never expected. Kim closes her hand around the bottle and listens.', { set: 'c13_end' }] },
  ],
};

// ───────────────────────── Chapter 14 ─────────────────────────
const ch14 = {
  n: 14, title: 'The Regent’s Last Deception', world: 'ember', time: 'dusk', spawn: 'king_front',
  as: (f) => f.c14_kimturn && !f.c14_frozen ? 'kim' : 'amber', spawnKim: 'pillar',
  intro: 'Without the coat she looked smaller, and a good deal more dangerous.',
  companion: (f) => f.c14_frozen ? 'kim' : null,
  steps: [
    { goal: 'Make him answer.', hint: 'Lord Ashlock stands just inside the doorway.', until: 'c14_kimturn' },
    { goal: 'KIM — step out from behind the pillar, where all of them can see you.', hint: 'Walk to the open doorway of the king’s chamber.', until: 'c14_frozen' },
    { goal: 'About as long as it takes to boil an egg. Go to Father.', hint: 'He is struggling upright.', until: 'c14_king' },
    { goal: 'Much later. Sit with Kim.', hint: 'She is on the corridor floor outside the door, her back against the warm wall.', until: 'c14_end' },
  ],
  npcs: [
    { id: 'guardOld', at: 'guard1', talk: [['Palace Guard', 'I was on the wall this afternoon. I saw the Ruby Flame come in with two girls in her claws and seawater running off them. Nobody’s told us why.']] },
    { id: 'guardYoung', at: 'guard2', talk: [['Young Guard', '…']] },
    { id: 'kim', at: 'pillar', if: (f) => !f.c14_kimturn, talk: null },
    { id: 'amber', at: 'king_front', if: (f) => f.c14_kimturn && !f.c14_frozen, talk: null },
    { id: 'ashlock', at: 'king_door_in', if: (f) => !f.c14_king, talk: (f) => f.c14_frozen ? ['His eyes go on moving, from Kim to the guards to the king, and that is all of him that can.'] : f.c14_kimturn ? null : [
      [A, 'You told me outsiders destroyed our ships. I watched our own Cinderwardens destroy mine.'],
      [L, 'A regrettable error. The patrols are instructed to prevent infiltration.'],
      { c: [['“I told them I was the princess.”', [[L, 'A clever impostor could say the same.']], 1], ['“Then they are badly trained.”', [[L, 'They are trained by me, Your Highness. They are trained very well.']], 0]], retry: 1 },
      { c: [['“With a dragon above her?”', [[L, 'Dragons can be stolen.']], 1], ['“An impostor with my face?”', [[L, 'Fog is kind to impostors.']], 0]], retry: 1 },
      { c: [['“Ruby would like to hear you say that. Shall I call her?”', ['For the first time, the regent does not have an answer ready.'], 1], ['“That’s absurd.”', [[L, 'Many dangerous things are.']], 0]], retry: 1 },
      [F, 'And what of the ambassadors?'], 'His voice is faint, but the room falls still.',
      [L, 'Your Majesty, these questions will only exhaust you.'], [A, 'Answer him.'],
      [L, 'Very well. The ambassadors sailed against my advice. Their ship was met in open water by vessels of a foreign power and destroyed. There were no survivors.'],
      [F, 'Which? Which power?'], [L, 'Does it matter now?'],
      [F, 'It matters. To me, Ashlock. I sent them. I chose them. The gentlest people we had. You brought me the news. Yourself. Wreckage, you said. You never said the patrol was there.'],
      [L, 'Your Majesty is confused. The fever…'],
      [F, 'My daughter gave her name today. Your ships fired on her. I am not confused. Not about that.'], [L, 'They believed…'],
      { c: [['“They did not believe. They didn’t even answer.”', [[A, 'Nobody shouts back at a ship he’s already been told to sink.']], 1], ['“Believed what?”', [[L, 'That the kingdom was in danger. As it is. As it always is.']], 0]], retry: 1 },
      'In the lantern on the bedside table, the little golden flame has drawn itself up as tall as it will go.',
      [L, 'I have kept this kingdom safe. While its king lay ill and its heir chased dragons, I kept it safe. That is what fear buys, Your Highness. People who are afraid stay home, and people who stay home stay alive.'],
      [A, 'And people who sail out to make friends?'], 'He does not reply.',
      [L, 'Guards. Take the princess to her chambers. Remove the outsider.'],
      'Neither guard moves at once. Amber stands between the regent and her father, palms glowing with a controlled ring of fire.',
      ['Palace Guard', 'Sir. We’ve no order that covers this.'], [L, 'You have mine.'],
      ['Palace Guard', 'You do, sir. And hers. And there’s His Majesty awake in the bed.'],
      [A, 'You do not command me.'], [L, 'I command the defense of this kingdom.'], [A, 'Then why are its defenders sinking peaceful ships?'],
      { set: 'c14_kimturn' }] },
    { id: 'king', at: 'king', talk: (f) => !f.c14_frozen ? null : f.c14_king ? [[F, 'Everything I have. It is not enough. But it is yours.']] : [
      [A, 'Do not hurt him. Secure him.'], 'The king struggles upright. Amber puts an arm behind his shoulders, and he lets her.',
      [F, 'By the authority of the crown. Lord Ashlock is removed. From the office of regent. Guard him. His orders to the Cinderwardens are stopped. All of them.'],
      'One guard bows. The other takes the regent’s seal of office. The stillness is already leaving him; his fingers uncurl from the doorframe one at a time.',
      [L, 'You should have left her on that side of the sea. You have no idea what you have brought home.'],
      { c: [['“I know exactly. I brought a friend.”', []]] },
      [K, 'I’m sorry I ran.'], [A, 'I’m sorry I didn’t tell you what I feared.'],
      [F, 'That was brave. But truth wants more than bravery. Find the records. Find who carried out his orders. Then we will know.'],
      'His fingers move toward Kim. She comes, and he turns her wrist to the light once more.',
      [F, 'They stood here. In this room. Your mother, just there. She had that look. Your look. Already decided. Your father was laughing at my hat.'],
      [K, 'You knew them.'], [F, 'I loved them. One season, they said. Then home. I said a ship was no place for a baby. She said a baby was just what peace needed. When the news came, I mourned three.'],
      [K, 'Will you tell me about them? When you’re stronger?'], [F, 'Everything I have. It is not enough. But it is yours.'],
      'Outside the window, the evening lamps of Emberland come on one by one.', { set: 'c14_king' }, { time: 'night' },
      'The regent is taken to the basalt fortress above the eastern harbor. No single arrest could undo years of fear. But it was a beginning.'] },
  ],
  things: [
    { id: 'step', at: 'king_door', auto: 3.5, if: (f) => f.c14_kimturn && !f.c14_frozen, script: [
      [K, 'Because he didn’t want anyone to reach us.'], [L, 'You.'],
      [K, 'Me. I’m from Sugarland. We’re the foreign power, I think. We have four fishing boats and a ferry, and we came with candy cane trees.'],
      [L, 'Guards. Remove this—'], 'He stops. He is looking at her wrist. The two pairs of golden birds stand out as clearly as if they had been drawn that morning.',
      'All the reason goes out of the regent’s face.', [L, 'That is not possible. That ship went down with everyone aboard.'],
      [F, 'You told me… no one saw it sink.'],
      'Kim has no training in fire, no sword, no authority. She has a travel pouch, her mother’s foresight, and two friends in danger. The regent lunges.',
      { qte: 'Throw the Stillbloom!' }, { fx: 'still' },
      'A soft silver shimmer settles around him. His limbs stiffen. It is not at all like the stories, where villains are struck down with thunder. It is quiet. The dust smells of a flower bed after rain.',
      [A, 'Kim?'], [K, 'Mum packed it. She said it might help me escape trouble. It only stops him moving. It doesn’t hurt. She said it lasts about as long as it takes to boil an egg. So I’d hurry.'],
      { take: 'stillbloom' }, { set: 'c14_frozen' }] },
    { id: 'floor', at: 'pillar', label: 'Sit beside Kim', if: (f) => f.c14_king && !f.c14_end, script: [
      { fade: 'Much later, when the physicians had come and gone' },
      [A, 'You were going to throw that at him and run.'], [K, 'That was Mum’s plan.'], [A, 'You didn’t run.'],
      [K, 'No. I think I’d already done my running for today.'], { set: 'c14_end' }] },
  ],
};

// ───────────────────────── Chapter 15 ─────────────────────────
const searched = [{ if: all('c15_orders', 'c15_names', 'c15_jar', 'c15_treat'), then: [[A, 'He’s been keeping Father ill.'], ['Royal Physician', 'We will suspend these preparations and examine His Majesty. We cannot promise what will recover, but we can stop giving him what we have not approved.'], { set: 'c15_search' }] }];
const fest = [{ if: all('f1', 'f2', 'f3'), then: [
  'Kim walks beside her with a borrowed lantern, looking up at the lit windows of colored glass with her mouth open.',
  'The king watches from his chair at the window. When the dancers reach the part where the first hearth is lit, he is seen to lift one thin hand and wave.', { set: 'c15_fest' }, { time: 'day' },
  { lead: 'The archivist has brought the ambassadors’ surviving letters. The archive is in the west wing, beyond the Hall of Learning.' }] }];
const ch15 = {
  n: 15, title: 'The Poisoned Crown', world: 'ember', time: 'day', spawn: 'regent_door',
  intro: '“He wrote everything down. That sort always does.”',
  companion: () => 'kim',
  steps: [
    { goal: 'Search the regent’s rooms.', hint: 'Speak to the steward. Then: the locked drawer, the lists beneath, the shelf — follow the scent — and the treatment orders on the long table.', until: 'c15_search' },
    { goal: 'Tell Father yourself. Let no one else do it.', hint: 'The king’s chamber.', until: 'c15_told' },
    { goal: 'The Festival of the First Flame — smaller, quieter, and nobody minds.', hint: 'Walk in the procession: light the three hearths in the market square, as you have every year of your life.', until: 'c15_fest' },
    { goal: 'Eleven letters in a flat box tied with red cord.', hint: 'The archivist waits in the archive, in the west wing beyond the Hall of Learning.', until: 'c15_letters' },
    { goal: 'Read to Father by the window.', hint: 'The king’s chamber.', until: 'c15_end' },
  ],
  npcs: [
    { id: 'steward', at: 'regent_s', talk: (f) => f.c15_search ? [[ST, 'Lark and Wren. I am glad somebody has asked, after all this time.']] : !f.c15_seal ? [
      [K, 'Where do we begin?'], [ST, 'Everywhere. He wrote everything down. That sort always does. They cannot bear for a thing to be done and not recorded.'],
      'A stooped, careful man who has served the king since before the illness, and been given less and less to do each year. He rolls back his sleeves.',
      [ST, 'The drawer by the window opens to the regent’s own seal. The guard gave it to me last night. Shall we?'], { set: 'c15_seal' }, { lead: 'Steward: the locked drawer by the window opens with the regent’s seal.' }] : f.c15_lists && !f.c15_names ? [
      [K, 'There are no names. Only the crest, and “lost at sea.” He didn’t even write their names.'],
      [ST, 'I know them. Forgive me. I thought you had been told. I carried their trunks down to the harbor myself.'],
      [ST, 'Ambassador Lark and Ambassador Wren, of the house of the Two Songs. They took the birds for their crest when they married. People said a house could not have two songs, and she said theirs did, and that was the end of the argument.'],
      'Kim says the names over, without sound. Lark. Wren.',
      [K, 'Which was my mother?'], [ST, 'Wren. She was the small one. She did most of the talking.'],
      [K, 'Then I’m like her.'], 'She laughs, and puts the back of her hand against her mouth.', { codex: 'twosongs' }, { set: 'c15_names' },
      [K, '…Amber. Do you smell that? Flowers. Somewhere on the shelves.'], { lead: 'Kim smells something floral on the regent’s shelves.' }, ...searched] : [[ST, 'Take your time. I have waited a long while for this particular piece of work.']] },
    { id: 'physician', at: 'regent_p', talk: (f) => f.c15_jar ? [['Royal Physician', 'I never prescribed this.']] : [['Royal Physician', 'I am here to see what was given in my name.']] },
    { id: 'king', at: 'king', talk: (f) => !f.c15_search ? [[F, 'Find the records, little spark.']] : !f.c15_told ? [
      'He listens with his eyes on the window. Then he asks to see the order with his own name on it, and looks at the signature for a long time.',
      [F, 'That is my hand. I remember the day. I had a fever, and he brought a stack of papers, and I signed them all because I trusted him and because my head ached. I made him, Amber. I handed it to him one sheet at a time, and thanked him.'],
      [A, 'You were ill.'], [F, 'I was ill afterward. That day I was only tired, and it was easier. Remember that, when you are queen. It will never look like giving the kingdom away. It will look like letting someone help.'],
      { c: [['“Then I’ll read everything I sign.”', [[F, 'Read it twice. And ask a friend who is not afraid of you to read it a third time. I believe you have one.']]]] },
      { set: 'c15_told' }, { time: 'night' }, { lead: 'The Festival of the First Flame is tonight, in the market square.' }] : !f.c15_letters ? [[F, 'Go on. I shall watch from the window.']] : f.c15_end ? [[F, 'Well. That is new.']] : [
      { fade: 'One morning the king asked to sit beside the window. A few days later he ate an entire meal' },
      'Then, as Amber reads to him, a small golden flame appears above his palm.', [A, 'Father?'], [F, 'It seems I still have a little spark.'],
      [F, 'Come in, come in. You are letting the warm out.'], 'It is the oldest joke in Emberland, where there is no such thing as a draft, and he looks delighted to have someone new to tell it to.',
      [F, 'Can you do this yet?'], [K, 'Only to torches. And once to every lamp in a corridor, by mistake.'], [F, 'Then you are further along than I was at your age. Give me your hand.'],
      { fx: 'pinkflame' }, 'The king tips the flame from his palm into hers, as easily as pouring water. It wavers. It turns from gold to a soft strawberry pink, steadies, and stands up straight.',
      [F, 'Well. That is new.'], 'For the first time in years the palace feels warm.', { set: 'c15_end' }] },
    { id: 'archivist', at: 'archive', if: 'c15_fest', talk: (f) => f.c15_letters ? [['Archivist', 'They are hers to keep now.']] : [
      'Eleven letters. Kim cannot make herself undo the knot, so Amber does it for her.',
      'They are written in two hands. One is small and quick and runs uphill. The other is large and keeps forgetting to leave room at the end of the line. Kim does not need to be told which is which.',
      'Halfway down the seventh letter, in the small quick hand, Kim finds herself.',
      [K, '“We have decided to bring the baby. I know what you will say. But think what they will see when we come ashore. Not two officials with a treaty. A family, with a child asleep in her cradle. Nobody is afraid of a cradle. She will be our best argument, and she need not say a word.”'],
      { codex: 'letter' },
      [A, 'She was right. You were found by people who weren’t afraid of a cradle.'], [K, 'She meant me to be an ambassador. I couldn’t even sit up. I must have been dreadful at it.'],
      [A, 'You did very well. You got ashore. It’s more than anyone else managed for a very long time.'], { set: 'c15_letters' }] },
    { id: 'orin', at: 'orin', talk: [[O, 'So you’re the one from over the water. Sit. Eat. No — two. You’ve had a week.']] },
    { id: 'dancer2', at: 'square_b', if: 'c15_told', pose: 'dance' },
    { id: 'dancer', at: 'square', if: 'c15_told', pose: 'dance', talk: [['Flame Dancer', 'A smaller dance this year, Highness. But the hearths still want lighting.']] },
  ],
  things: [
    { id: 'drawer', at: 'regent_drawer', label: 'The locked drawer', if: (f) => f.c15_seal && !f.c15_orders, script: [
      [ST, '“Any vessel approaching from the west under an unknown flag is to be turned back. If it does not turn, it is to be sunk. No report is to be made to the palace.”'],
      [ST, 'That is dated the spring after His Majesty fell ill. There is one like it for every year since.'], [K, 'The west. That’s us.'],
      [K, 'The harbor council sends a ship exploring every few years. They always come home saying there’s nothing out there but fog, and ships in the fog that warn them off. We thought it was pirates.'],
      { set: 'c15_orders' }, ...searched] },
    { id: 'lists', at: 'regent_drawer', label: 'Beneath the orders', if: (f) => f.c15_orders && !f.c15_lists, script: [
      'The lists go back further than the ambassadors: merchant crews, a mapmaker, two brothers who had sailed west with a cargo of glass. Every name has the same three words beside it. Lost at sea.',
      'His own wardens had been waiting much nearer than the far shore.',
      'Among them: the last ambassadors, marked only by the crest on Kim’s bracelet. Kim touches the page.', { set: 'c15_lists' }, { lead: 'The steward is watching Kim read the list. He seems to want to say something.' }] },
    { id: 'jar', at: 'regent_shelf', label: 'Follow the scent', if: (f) => f.c15_names && !f.c15_jar, script: [
      'A jar of ointment with a pale blue flower stamped into its wax seal. Kim opens it and goes still.',
      [K, 'Stillbloom.'], [A, 'The flower your mother packed?'], [K, 'Yes. But this smells much stronger.'],
      [K, 'Sleep, in a tea, a pinch at a time. Aches, in a salve. But you’d never give it every day. And never this strong. Even I know that, and I only fill the bottles.'],
      { set: 'c15_jar' }, { lead: 'What was the regent giving the king? Check the papers on his long table.' }, ...searched] },
    { id: 'treat', at: 'regent_desk', label: 'Papers on the long table', if: (f) => f.c15_seal && !f.c15_treat, script: (g) => !g.f.c15_jar ? ['Rows of papers, straight as a harbor wall. Treatment schedules for His Majesty, in the regent’s hand. A dilution in his chamomile tea. A salve for his joints. The ingredient is only a small drawn flower.'] : [
      'The same flower, in the king’s treatment orders: a dilution added to his tea every night, and a salve for aching joints. The attendants were told the instructions came from his physicians.',
      ['Royal Physician', 'I never prescribed this.'], { set: 'c15_treat' }, ...searched] },
    { id: 'f1', at: 'hearth1', label: 'Festival hearth', flame: 1, lit: 'f1', if: (f) => f.c15_told && !f.f1, script: [{ set: 'f1' }, ...fest] },
    { id: 'f2', at: 'hearth2', label: 'Festival hearth', flame: 1, lit: 'f2', if: (f) => f.c15_told && !f.f2, script: [{ set: 'f2' }, ...fest] },
    { id: 'f3', at: 'hearth3', label: 'Festival hearth', flame: 1, lit: 'f3', if: (f) => f.c15_told && !f.f3, script: [{ set: 'f3' }, ...fest] },
  ],
};

// ───────────────────────── Chapter 16 ─────────────────────────
const shades = [{ if: all('s_sm', 's_tf', 's_lv'), then: [[SM, 'They needn’t!'], [F, 'You are warm. What else are they supposed to do?'], 'Amber looks at him. He is looking at Kim, who said those very words to her once on a mountain, and who has evidently been telling stories.', { set: 'c16_shades' }] }];
const ch16 = {
  n: 16, title: 'The First Bridges', world: 'ember', time: 'day', spawn: 'quay',
  intro: 'The first ship from Sugarland arrived beneath banners of welcome instead of weapons.',
  companion: (f) => f.c16_ship ? 'kim' : null,
  canWhistle: (f) => !f.c16_ship,
  whistle: (f) => f.c16_ship ? null : [
    { ruby: 'arrive', at: 'quay_ruby' }, [A, 'Three dragons to show them the way in. Let’s be the first.'],
    { fly: { rings: [[150, 40, 34], [200, 44, 40]], fogTo: 0.04 } },
    { fly: { world: 'sea', start: [0, 40, 0], fog: 0.04, ship: [0, 0, -260], rings: [[0, 36, -120], [0, 26, -230]], barks: { 1: 'A Sugarland ship, bright as a cake stand, feeling its way through the gray behind a Cinderwarden pilot boat with every lantern lit.' } } },
    [A, 'Follow the red! We’ll bring you home!'],
    { fly: { world: 'ember', start: [220, 44, 40], fog: 0.04, fogTo: 0.004, rings: [[170, 36, 36], [136, 22, 34]], land: 'quay', barks: { 0: 'For the first time in a generation, the wardens’ ships have gone out to bring someone home.' } } },
    { ruby: 'leave' },
    'It carries letters, craftsmen, musicians, seeds, books, and a new collection of gifts to replace those lost at sea. The people of Emberland crowd the harbor to see visitors with bright hair and confection-colored clothes.',
    { set: 'c16_ship' }, { lead: 'The Sugarlanders are pink in the face. Master Orin has run off to fetch something.' }],
  steps: [
    { goal: 'A sail in the fog. Go out and bring them home.', hint: 'The ruby whistle. Then follow the rings out through the fog and lead the ship back.', until: 'c16_ship' },
    { goal: 'It is a mild day by Emberian reckoning. The visitors are melting.', hint: 'Master Orin has an armful of paper sunshades. Take them to Smorella, Tafford and Grandma Lava.', until: 'c16_shades' },
    { goal: 'Someone is inspecting the crowd over her spectacles.', hint: 'Madame Praline, on the quay, in a sensible linen dress.', until: 'c16_praline' },
    { goal: 'Weeks later. Kim has news.', hint: 'Talk to Kim.', until: 'c16_amb' },
    { goal: 'One evening, months after. The palace garden.', hint: 'Father is walking beneath Mother’s statue.', until: 'c16_end' },
  ],
  npcs: [
    { id: 'king', at: 'awning', if: (f) => !f.c16_amb, talk: [[F, 'Under an awning, in a chair, like a market stall. I have never been so happy to be furniture.']] },
    { id: 'king', at: 'statue_k', if: 'c16_amb', talk: (f) => f.c16_end ? [[F, 'Better ones.']] : [
      [F, 'She would have liked your friend.'], [A, 'I think so too.'], 'He looks toward the harbor, where a Sugarland vessel rests safely at anchor.',
      [F, 'I wish I had questioned the old stories sooner.'], [A, 'So do I.'], 'Then she takes his arm.',
      { c: [['“But we can write better ones now.”', []]] }, { set: 'c16_end' }] },
    { id: 'orin', at: 'quay_orin', if: (f) => !f.c16_amb, talk: (f) => !f.c16_ship ? [[O, 'Is that a sail, Highness? In the FOG?']] : f.shades ? [[O, 'Go on, go on! And cold fruit water after!']] : [
      'Master Orin has abandoned his tray of buns and returned with an armful of the wide paper sunshades Emberians carry at midsummer.',
      [O, 'They’re cooking, Highness! Here — take these to the ones by the gangway.'], { give: 'shades' }, { set: 'shades' }] },
    { id: 'smorella', at: 'quay_s', if: (f) => f.c16_ship && !f.c16_amb, talk: (f) => f.shades && !f.s_sm ? [[SM, 'Oh! Thank you, dear. Is it always like this?'], [A, 'This is a mild day.'], { set: 's_sm' }, ...shades] : [[SM, 'You both came back. I am counting that as a promise kept.']] },
    { id: 'tafford', at: 'quay_t', if: (f) => f.c16_ship && !f.c16_amb, talk: (f) => f.shades && !f.s_tf ? [[TF, 'A shade! I might be warm. Somebody finally asked.'], { set: 's_tf' }, ...shades] : [[TF, 'By air, she said. And here I am by sea, like a sensible man.']] },
    { id: 'lava', at: 'quay_l', if: (f) => f.c16_ship && !f.c16_amb, talk: (f) => f.shades && !f.s_lv ? [['Grandma Lava', 'Mountains of fire. I told her. I made it up, and it was true as well.'], { set: 's_lv' }, ...shades] : [['Grandma Lava', 'The best ones are.']] },
    { id: 'praline', at: 'quay_p', if: (f) => f.c16_shades && !f.c16_amb, talk: (f) => f.c16_praline ? [[P, 'Hm.']] : [
      [P, 'Not a coat among them. I don’t know what I’m to do with myself.'], [A, 'You could let me pay for mine.'], [P, 'Certainly not. I see you haven’t got it on.'], [A, 'My father won’t give it back.'],
      'Madame Praline looks across at the king beneath his awning, and for once has nothing to say. She only nods, as if a piece of work had come out the way she intended.',
      { set: 'c16_praline' }, { fade: 'Kim spent weeks in Emberland, learning the fire that stirred in her hands' }] },
  ],
  things: [
    { id: 'amb', at: 'player', kimTalk: 1, label: 'Talk to Kim', if: (f) => f.c16_praline && !f.c16_amb, script: [
      'With the agreement of Sugarland’s leaders and Emberland’s crown, Kim has accepted a formal role as ambassador between the two kingdoms. The title feels impossibly grand for someone who still misplaces her ribbons and argues with Tira about pastries.',
      [A, 'You’re very good at meeting strangers.'], [K, 'Only the nice ones.'], [A, 'You met me when I was hiding half my life.'], [K, 'And you still seemed nice.'],
      { set: 'c16_amb' }, { fade: 'One evening, months after the attack' }, { time: 'dusk' }, { tp: 'garden' }] },
  ],
};

// ───────────────────────── Chapter 17 ─────────────────────────
const ch17 = {
  n: 17, title: 'The Eternal Flames', world: 'ember', time: 'dusk', spawn: 'terrace',
  intro: 'This was not an ambassador’s visit. There were no papers to sign.',
  companion: (f) => f.c17_chair ? 'kim' : null,
  steps: [
    { goal: 'Kim is back, on a rose-gold evening.', hint: 'She is sitting in one of the obsidian chairs.', until: 'c17_chair' },
    { goal: 'Climb to the high viewing terrace.', hint: 'East of your tower, above the king’s chamber. Father is waiting in a crimson cloak.', until: 'c17_cape' },
    { goal: 'Night gathers over the Dragon Mountains.', hint: 'Stand at the rail.', until: 'c17_flame' },
    { goal: 'Watch the Eternal Flame together.', hint: 'Kim is leaning on the terrace rail.', until: 'c17_end' },
  ],
  npcs: [
    { id: 'kim', at: 'terrace_chair', if: (f) => !f.c17_chair, talk: [
      [A, 'Comfortable?'], [K, 'Not particularly.'], [A, 'Then you understand our architecture perfectly.'], { set: 'c17_chair' },
      { lead: 'Tonight is Ruby’s induction into the Council of Eternal Flames. The king is on the high viewing terrace.' }] },
    { id: 'king', at: 'high_king', talk: (f) => f.c17_cape ? [[F, 'Look up, little spark.']] : !f.c17_chair ? null : [
      [F, 'Kim! And how are Smorella, Tafford, and the workshop?'], [K, 'Arguing about cinnamon, Your Majesty.'],
      'The wind is stronger at this height. A warm wind, but Kim’s shoulders are bare, and Amber sees her rub her arms.',
      { c: [['Put your flying cape around her.', []]] },
      [K, 'I’m not cold. I’m never cold.'], [A, 'I know. I’ve wanted to do that for months. Somebody once dressed me in the street, and I never got to return it.'],
      [K, 'It’s very light.'], [A, 'It was made for somewhere warm.'], [K, 'Then it had better stay here. And so had I, now and then.'], { set: 'c17_cape' }, { time: 'night' }] },
  ],
  things: [
    { id: 'rail', at: 'high_rail', label: 'Stand at the rail', if: (f) => f.c17_cape && !f.c17_flame, script: [
      'In the valleys below, market squares fill with families. Candles appear in windows. Even the distant harbors seem to hold their breath.',
      'A deep call rolls across the mountains. One by one, dragons rise into the sky: sapphire blue, emerald green, amethyst violet, rose quartz pink, opal white, citrine gold.',
      'Amber presses the curved ruby whistle against her heart. She does not blow it. Tonight Ruby has a place to take of her own choosing.',
      { tip: 'asruby' },
      { fly: { solo: 1, council: 1, start: [20, 40, -150], rings: [[0, 70, -190], [-40, 100, -200], [-70, 120, -170]], barks: { 0: 'Tonight, you fly as Ruby.', 2: 'The council dragons form a wide circle above the highest peak. One place is empty.' } } },
      { qte: 'Breathe the ruby flame' }, { fx: 'eternal' },
      'Blue fire, then green, gold, white, pink, violet — and red. The flames intertwine without consuming one another. They become a great turning crown of light, vast enough to be seen from villages across Emberland. Many fires, one celebration.',
      'Cheers roll from the valleys. The king lifts his face into the colored light, and Amber sees tears shining in his eyes.', { set: 'c17_flame' }] },
    { id: 'end', at: 'player', kimTalk: 1, label: 'Stand with Kim', if: (f) => f.c17_flame && !f.c17_end, script: [
      { cut: [{ bg: 'flames' }, { amber: 'smile' }, { kim: 'smile' },
        [K, 'I never thought anything was missing from my life. I had Mum and Dad, Grandma Lava, Marsh, Tira. I had everything.'], [A, 'And you still do.'],
        { kim: 'amazed' }, [K, 'Yes. I just didn’t know there was more to discover. A whole other place. And you.'],
        { amber: 'worried' }, [A, 'I used to think I’d have to do everything alone.'],
        { kim: 'smile' }, [K, 'Well, that’s unfortunate.'], [A, 'Why?'],
        { kim: 'laugh' }, [K, 'Because you’re rather stuck with me now.'],
        { amber: 'laugh' }, 'One had crossed the sea looking for friendship. The other had crossed it looking for the beginning of her story. Both had found more than they expected.',
        { amber: 'smile' }, { kim: 'smile' }, 'Neither had been looking for a sister. But somehow, across two kingdoms and an entire sea, they had found one.',
        'And above them, the dragons kept the night bright.'] }, { codex: 'sisters' }, { set: 'c17_end' }] },
  ],
};

// ───────────────────────── Epilogue: free roam ─────────────────────────
const ch18 = {
  n: 18, title: 'Ever After', world: 'ember', time: 'day', spawn: 'terrace', free: 1,
  intro: 'Two kingdoms, one sea, and a dragon who knows the way.',
  companion: () => 'kim',
  canWhistle: () => true,
  steps: [{ goal: 'Explore the Everlands. Whistle for Ruby anywhere; fly into the fog to cross the sea.', hint: 'Visit old friends in both kingdoms. They have new things to say.', until: 'never' }],
  npcsByWorld: {
    ember: [
      { id: 'king', at: 'awning', talk: [[F, 'You are letting the warm out! …I shall never tire of that.']] },
      { id: 'orin', at: 'orin', talk: [[O, 'Strawberry-glaze buns, Highness. The ambassador’s recipe. They sell out by ten.']] },
      { id: 'aldren', at: 'aldren', talk: [['Master Aldren', 'They have hung the old map again. I find I had forgotten half the cakes.']] },
      { id: 'tender', at: 'ladder', talk: [[LT, 'Cold cistern water for every visitor now. Regent’s orders — the new one. That’s you, Highness.']] },
      { id: 'steward', at: 'regent_s', talk: [[ST, 'These rooms are the Embassy of Two Songs now. Much better use for a long table.']] },
    ],
    sugar: [
      { id: 'praline', at: 'praline', talk: [[P, 'Coats for Emberian visitors. I have never been so busy. Arms out.']] },
      { id: 'smorella', at: 'house_s', talk: [[SM, 'Sit by the oven, both of you. Tafford, move your feet.']] },
      { id: 'tafford', at: 'workshop_t', talk: [[TF, 'An Emberian glassmaker is teaching me colours I have no names for. I am making some up.']] },
      { id: 'lava', at: 'lava', talk: [['Grandma Lava', 'Now I shall need new stories. The old ones have all turned out true.']] },
      { id: 'tartman', at: 'tart', talk: [['Confectioner', 'Fire-toasted lemon tarts! An exchange student did them. Best I’ve ever had.']] },
    ],
  },
  things: [],
};

export default [ch12, ch13, ch14, ch15, ch16, ch17, ch18];
