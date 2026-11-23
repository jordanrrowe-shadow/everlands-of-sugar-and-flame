// Short "Meanwhile, Kim…" interludes played as Kim between the Sugarland days. Keyed by the chapter that has just ended.
// A step is narration ('text'), a spoken line (['Kim', 'text']), or { go: [x, z], label } / { find: [[x, z], …], label }:
// golden markers to walk to before the story carries on.
const K = 'Kim';
// What Kim calls when she has run ahead and you have fallen behind (spoken aloud).
// What Kim shouts when Tira is lost, and what she says when she strays from the search.
export const TIRA_CALLS = ['Tira!', 'Tira, where are you?', 'Here, Tira! Come on!'];
export const KIM_BACK = ['Not that way. Tira first.', 'She wouldn’t have gone this far. Back we go.'];
export const KIM_CALLS = ['This way!', 'Come on, slow feet!', 'Over here!', 'Keep up, Amber!'];
export const INTERLUDES = {
  4: { title: 'A scone for the stranger', at: [34, 9], steps: [
    'Meanwhile, Kim cannot stop thinking about the stranger in the red dress, who ate one tart as though it were a state occasion.',
    [K, 'She’ll be hungry. Travellers are always hungry. Dad! I’m taking a scone!'],
    { go: [37, -6], label: 'Fetch a warm scone from the workshop, inside the confectionery' },
    'The scone is still warm through the napkin. Tira rides on Kim’s shoulder, guarding it with great seriousness.',
    { go: [18, 51], label: 'Carry it to the inn' },
    'The innkeeper shakes his head. The room was taken, and paid for, and the bed has not been slept in.',
    [K, 'Not there? But where would anybody sleep, if not in a bed?'],
    'Kim leaves the scone on the windowsill with a note that says FOR AMBER in her best handwriting, and looks for a long moment down the forest path.',
    [K, 'Come on, Tira. She’ll turn up. People who like tarts always do.']] },
  5: { title: 'Tira is missing', at: [0, 26], call: 'Call for Tira', steps: [
    'Meanwhile, Kim has turned the satchel inside out twice. There are crumbs in it, and a button, and no Tira.',
    [K, 'Tira? Tira! This is not funny. It is a little bit funny. Tira!'],
    { find: [[8, 12], [-7, 30], [0, 20]], label: 'Search the market for Tira' },
    'Not under the tart stall. Not in the ribbon basket. Not paddling in the syrup fountain, for once.',
    [K, 'Where do you go when you are small and cross and want to be warm?'],
    { go: [-14.5, 46], label: 'Try Madame Praline’s coats' },
    'A cream-coloured sleeve on the rail has a lump in it. The lump is snoring.',
    [K, 'There you are. In a coat pocket. Of course you are.'],
    'Tira opens one eye, considers the matter, and allows herself to be carried home.'] },
  6: { title: 'A flask for a cold friend', at: [34, 9], steps: [
    'Meanwhile, Kim has decided that Amber is always cold, and that something ought to be done about it.',
    [K, 'Hot chocolate. The proper kind, with the cinnamon. She won’t ask, so I shan’t give her the chance.'],
    { go: [8, 11], label: 'Buy chocolate at the tart stall' }, { go: [29, 12], label: 'Borrow Grandma Lava’s flask' },
    'Grandma Lava hands over the flask without a single question, which is how Kim knows she has a great many.',
    { go: [0, 60], label: 'Leave it at the signpost' },
    [K, 'She comes this way every evening. She thinks nobody has noticed.'],
    'Kim stands the flask against the lollipop signpost, wraps her own scarf round it to keep the heat in, and goes home whistling.'] },
  7: { title: 'Crumbs for a dragon', at: [34, 9], steps: [
    'Meanwhile, Kim has met a dragon, and cannot think about anything else.',
    [K, 'What do dragons eat? Tira, what do dragons eat? Don’t look at me like that. Not ferrets.'],
    { find: [[37, -6], [8, 11], [-7, 30]], label: 'Gather a basket: pastries, tarts, a red ribbon' },
    'A basket of yesterday’s pastries, six lemon tarts, and a red ribbon for the handle, because a present ought to look like one.',
    { go: [0, 112], label: 'Take the forest path' }, { go: [-38, 139], label: 'Leave the basket by the cave' },
    'Two points of red open in the dark of the cave. Kim sets the basket down very carefully and takes four polite steps backwards.',
    [K, 'It’s only cake. Good night, Ruby. …She blinked at me, Tira. Did you see? She blinked.']] },
  8: { title: 'Colours for the window', at: [34, 9], steps: [
    'Meanwhile, Tafford is short of sugar-glass for the workshop window, and has sent the fastest pair of feet he owns.',
    [K, 'Rose, mint and lemon. Rose, mint and lemon. If I say it the whole way I shan’t come back with liquorice again.'],
    { find: [[-13, 7], [-11, 30], [9, 42]], label: 'Collect three colours of sugar-glass' },
    'Three paper twists of glass, one from each stall, and a fourth pressed on her for luck that is plainly liquorice.',
    { go: [34, -2], label: 'Run them back to the workshop' },
    [K, 'Rose, mint, lemon. And liquorice. Don’t say anything.']] },
};
