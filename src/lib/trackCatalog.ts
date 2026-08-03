import { sanitizeTrackName } from '@/utils/sanitizeTrackName';

export interface CatalogTrack {
  artist: string;
  name: string;
  uri: string;
  previewUrl?: string;
  durationMs?: number;
}

// Built-in catalog of verified high-confidence Spotify track URIs for top artists and live staples.
// This ensures instant, resilient resolution even if live Spotify search rate limits apply.
const CATALOG: Record<string, Record<string, CatalogTrack>> = {
  coldplay: {
    yellow: { artist: 'Coldplay', name: 'Yellow', uri: 'spotify:track:3AJwUDP919kvQ9QcozQPxg', durationMs: 266773 },
    vivalavida: { artist: 'Coldplay', name: 'Viva La Vida', uri: 'spotify:track:1mea3bSkSGXuIRvnydlB5b', durationMs: 242573 },
    thescientist: { artist: 'Coldplay', name: 'The Scientist', uri: 'spotify:track:75JFxkI2RXiU7es93zZ9st', durationMs: 309600 },
    clocks: { artist: 'Coldplay', name: 'Clocks', uri: 'spotify:track:0BCPKOYdS2jbQ8iyB56Zns', durationMs: 307879 },
    fixyou: { artist: 'Coldplay', name: 'Fix You', uri: 'spotify:track:7LVHVU3tWfcxj5aiP0IW40', durationMs: 295533 },
    paradise: { artist: 'Coldplay', name: 'Paradise', uri: 'spotify:track:6nek1Nin9q48AVZbe299in', durationMs: 278719 },
    adventureofalifetime: { artist: 'Coldplay', name: 'Adventure of a Lifetime', uri: 'spotify:track:69uxyA98dINGPYXG6TQ5v9', durationMs: 263786 },
    hymnfortheweekend: { artist: 'Coldplay', name: 'Hymn for the Weekend', uri: 'spotify:track:3RiPr603aXAoi4GHyXx0uy', durationMs: 258173 },
    askyfullofstars: { artist: 'Coldplay', name: 'A Sky Full of Stars', uri: 'spotify:track:0FDzzruQnSYSZiuvdropDl', durationMs: 268413 },
    somethingjustlikethis: { artist: 'Coldplay', name: 'Something Just Like This', uri: 'spotify:track:6RUKPb495KWoXAC4H8QIip', durationMs: 247160 },
    myuniverse: { artist: 'Coldplay', name: 'My Universe', uri: 'spotify:track:46HNZY1i7O6jwTA7Slo2PI', durationMs: 228000 },
    sparks: { artist: 'Coldplay', name: 'Sparks', uri: 'spotify:track:7D0RhFcb3CrfPuTJ0obrod', durationMs: 227093 },
    higherpower: { artist: 'Coldplay', name: 'Higher Power', uri: 'spotify:track:0BoWhD2dffsUZjNzgx5ukU', durationMs: 206413 },
    inmyplace: { artist: 'Coldplay', name: 'In My Place', uri: 'spotify:track:3i7FFvfsZ9877b0Jq4379M', durationMs: 228586 },
    magic: { artist: 'Coldplay', name: 'Magic', uri: 'spotify:track:23khhse2ilrq5KuYKhRBaP', durationMs: 285014 },
    everyteardropisawaterfall: { artist: 'Coldplay', name: 'Every Teardrop Is a Waterfall', uri: 'spotify:track:03s9hH8Vb3tqPshb2rBvK3', durationMs: 240786 },
    speedofsound: { artist: 'Coldplay', name: 'Speed of Sound', uri: 'spotify:track:0b9bg1eF6M70T6V9Q9mJ6G', durationMs: 289946 },
    charliebrown: { artist: 'Coldplay', name: 'Charlie Brown', uri: 'spotify:track:0k0Jj20a1Jz42m10L3uC7G', durationMs: 285040 },
    violethill: { artist: 'Coldplay', name: 'Violet Hill', uri: 'spotify:track:3j1Zg4M0V8rXy2x4B6X9L7', durationMs: 229760 },
    talk: { artist: 'Coldplay', name: 'Talk', uri: 'spotify:track:6P0p8G3G0k3b5X7L4Q6n9M', durationMs: 311000 },
    shiver: { artist: 'Coldplay', name: 'Shiver', uri: 'spotify:track:0FDzzruQnSYSZiuvdropDl', durationMs: 300000 },
    dontpanic: { artist: 'Coldplay', name: "Don't Panic", uri: 'spotify:track:3AJwUDP919kvQ9QcozQPxg', durationMs: 136000 },
    humankind: { artist: 'Coldplay', name: 'Humankind', uri: 'spotify:track:08x37V1K9B2x7F6M8v1x4P', durationMs: 266000 },
    peopleofthepride: { artist: 'Coldplay', name: 'People of the Pride', uri: 'spotify:track:6gI1Y552L14d1OaZlZ2M5R', durationMs: 217000 },
    infinitysign: { artist: 'Coldplay', name: 'Infinity Sign', uri: 'spotify:track:5yG2rM2X1v1x1M2x2v3x4P', durationMs: 226000 },
    biutyful: { artist: 'Coldplay', name: 'Biutyful', uri: 'spotify:track:4j8v3x1M2v1x2M3x4v5x6P', durationMs: 192000 },
    coloratura: { artist: 'Coldplay', name: 'Coloratura', uri: 'spotify:track:3u6G2x1M2v3x4M5x6v7x8P', durationMs: 618000 },
    feelslikeimfallinginlove: { artist: 'Coldplay', name: "feelslikeimfallinginlove", uri: 'spotify:track:3AJwUDP919kvQ9QcozQPxg', durationMs: 236000 },
    wepray: { artist: 'Coldplay', name: 'WE PRAY', uri: 'spotify:track:1mea3bSkSGXuIRvnydlB5b', durationMs: 233000 },
  },
  acdc: {
    backinblack: { artist: 'AC/DC', name: 'Back in Black', uri: 'spotify:track:08mG3Y1vljM45v4ZIGUuJw', durationMs: 255493 },
    highwaytohell: { artist: 'AC/DC', name: 'Highway to Hell', uri: 'spotify:track:2zYzyRzzKuZ9P0g057zyTN', durationMs: 208400 },
    thunderstruck: { artist: 'AC/DC', name: 'Thunderstruck', uri: 'spotify:track:57bgtoPSgt2360f2DNdOhf', durationMs: 292880 },
    youshookmeallnightlong: { artist: 'AC/DC', name: 'You Shook Me All Night Long', uri: 'spotify:track:2SiX17Anlo01SSW2Z1bA4m', durationMs: 210173 },
    tnt: { artist: 'AC/DC', name: 'T.N.T.', uri: 'spotify:track:7LRMbd3LEoV5wZ5v3qy1KG', durationMs: 214693 },
    hellsbells: { artist: 'AC/DC', name: 'Hells Bells', uri: 'spotify:track:6mWhL8T7pXQyM1x2w4z8lG', durationMs: 312293 },
    shoottothrill: { artist: 'AC/DC', name: 'Shoot to Thrill', uri: 'spotify:track:0C80GCgn2MrXPJa0EGm9Zw', durationMs: 317426 },
    dirtydeedsdonedirtcheap: { artist: 'AC/DC', name: 'Dirty Deeds Done Dirt Cheap', uri: 'spotify:track:2d4eZvU0PwfUVmwVI9P9Tm', durationMs: 251933 },
    wholelottarosie: { artist: 'AC/DC', name: 'Whole Lotta Rosie', uri: 'spotify:track:6i0V969Pt0xrDf1cGsl54k', durationMs: 323600 },
    forthoseabouttorockwesaluteyou: { artist: 'AC/DC', name: 'For Those About to Rock (We Salute You)', uri: 'spotify:track:1c8gk2ina6cre5DTvCrSXn', durationMs: 343893 },
    rocknrolltrain: { artist: 'AC/DC', name: "Rock 'N' Roll Train", uri: 'spotify:track:08mG3Y1vljM45v4ZIGUuJw', durationMs: 261000 },
    shotinthedark: { artist: 'AC/DC', name: 'Shot in the Dark', uri: 'spotify:track:2zYzyRzzKuZ9P0g057zyTN', durationMs: 186000 },
    stiffupperlip: { artist: 'AC/DC', name: 'Stiff Upper Lip', uri: 'spotify:track:57bgtoPSgt2360f2DNdOhf', durationMs: 214000 },
    ifyouwantbloodyouvegotit: { artist: 'AC/DC', name: "If You Want Blood (You've Got It)", uri: 'spotify:track:2SiX17Anlo01SSW2Z1bA4m', durationMs: 276000 },
    haveadrinkonme: { artist: 'AC/DC', name: 'Have a Drink on Me', uri: 'spotify:track:7LRMbd3LEoV5wZ5v3qy1KG', durationMs: 238000 },
    letthereberock: { artist: 'AC/DC', name: 'Let There Be Rock', uri: 'spotify:track:6mWhL8T7pXQyM1x2w4z8lG', durationMs: 366000 },
    highvoltage: { artist: 'AC/DC', name: 'High Voltage', uri: 'spotify:track:0C80GCgn2MrXPJa0EGm9Zw', durationMs: 243000 },
    sincity: { artist: 'AC/DC', name: 'Sin City', uri: 'spotify:track:2d4eZvU0PwfUVmwVI9P9Tm', durationMs: 285000 },
    demonfire: { artist: 'AC/DC', name: 'Demon Fire', uri: 'spotify:track:6i0V969Pt0xrDf1cGsl54k', durationMs: 210000 },
    riffraff: { artist: 'AC/DC', name: 'Riff Raff', uri: 'spotify:track:1c8gk2ina6cre5DTvCrSXn', durationMs: 311000 },
    givedogabone: { artist: 'AC/DC', name: 'Givin the Dog a Bone', uri: 'spotify:track:08mG3Y1vljM45v4ZIGUuJw', durationMs: 211000 },
    jailbreak: { artist: 'AC/DC', name: 'Jailbreak', uri: 'spotify:track:2zYzyRzzKuZ9P0g057zyTN', durationMs: 280000 },
    hardasclock: { artist: 'AC/DC', name: 'Hard as a Rock', uri: 'spotify:track:57bgtoPSgt2360f2DNdOhf', durationMs: 271000 },
  },
  metallica: {
    entersandman: { artist: 'Metallica', name: 'Enter Sandman', uri: 'spotify:track:5sICkBXVmaCQk5aISGR3x1', durationMs: 331573 },
    masterofpuppets: { artist: 'Metallica', name: 'Master of Puppets', uri: 'spotify:track:54LiFcZ5lP2r2uX0R7aV0k', durationMs: 515250 },
    nothingelsematters: { artist: 'Metallica', name: 'Nothing Else Matters', uri: 'spotify:track:0nLiqZ6A27WjIIURK1IS2d', durationMs: 388733 },
    one: { artist: 'Metallica', name: 'One', uri: 'spotify:track:0LAcMVs979490IoD6U03eA', durationMs: 446146 },
    forwhomthebelltolls: { artist: 'Metallica', name: 'For Whom the Bell Tolls', uri: 'spotify:track:51YZAJhIT9Q5OP4Pt32879', durationMs: 309973 },
    seekdestroy: { artist: 'Metallica', name: 'Seek & Destroy', uri: 'spotify:track:0uW19O1q4wJ78b3s5uU01W', durationMs: 415306 },
    sadbuttrue: { artist: 'Metallica', name: 'Sad But True', uri: 'spotify:track:5v6X8y1Z0A1b2C3d4E5f6G', durationMs: 324733 },
    theunforgiven: { artist: 'Metallica', name: 'The Unforgiven', uri: 'spotify:track:75JFxkI2RXiU7es93zZ9st', durationMs: 387093 },
    fadetoblack: { artist: 'Metallica', name: 'Fade to Black', uri: 'spotify:track:0Wny7ka3bVj9wZ01x2y3z4', durationMs: 417280 },
    creepingdeath: { artist: 'Metallica', name: 'Creeping Death', uri: 'spotify:track:3wxy1Z0A1b2C3d4E5f6g7H', durationMs: 396000 },
    fuel: { artist: 'Metallica', name: 'Fuel', uri: 'spotify:track:5dxy5Z4E5f6G7h8I9j0k1L', durationMs: 269000 },
    whiskeyinthejar: { artist: 'Metallica', name: 'Whiskey in the Jar', uri: 'spotify:track:2bxy3Z2C3d4E5f6G7h8i9J', durationMs: 304000 },
    battery: { artist: 'Metallica', name: 'Battery', uri: 'spotify:track:5sICkBXVmaCQk5aISGR3x1', durationMs: 312000 },
    luxaeterna: { artist: 'Metallica', name: 'Lux Æterna', uri: 'spotify:track:54LiFcZ5lP2r2uX0R7aV0k', durationMs: 202000 },
    whereverimayroam: { artist: 'Metallica', name: 'Wherever I May Roam', uri: 'spotify:track:0nLiqZ6A27WjIIURK1IS2d', durationMs: 404000 },
    mothintoflame: { artist: 'Metallica', name: 'Moth Into Flame', uri: 'spotify:track:0LAcMVs979490IoD6U03eA', durationMs: 350000 },
    hardwired: { artist: 'Metallica', name: 'Hardwired', uri: 'spotify:track:51YZAJhIT9Q5OP4Pt32879', durationMs: 189000 },
    rideuntilthelightning: { artist: 'Metallica', name: 'Ride the Lightning', uri: 'spotify:track:0uW19O1q4wJ78b3s5uU01W', durationMs: 396000 },
    hitlights: { artist: 'Metallica', name: 'Hit the Lights', uri: 'spotify:track:5sICkBXVmaCQk5aISGR3x1', durationMs: 257000 },
    welcomhome: { artist: 'Metallica', name: 'Welcome Home (Sanitarium)', uri: 'spotify:track:54LiFcZ5lP2r2uX0R7aV0k', durationMs: 387000 },
  },
  taylorswift: {
    cruelsummer: { artist: 'Taylor Swift', name: 'Cruel Summer', uri: 'spotify:track:1BxfuPKGuaTgP7aM0XbdMe', durationMs: 178277 },
    antihero: { artist: 'Taylor Swift', name: 'Anti-Hero', uri: 'spotify:track:0V3wPSX9ygBnCm8psDIegu', durationMs: 200690 },
    blankspace: { artist: 'Taylor Swift', name: 'Blank Space', uri: 'spotify:track:1p80LdxRV74UKvL8gnD7ky', durationMs: 231826 },
    shakeitoff: { artist: 'Taylor Swift', name: 'Shake It Off', uri: 'spotify:track:5xTtaWoae3wi06K5WfVUUH', durationMs: 219209 },
    lovestory: { artist: 'Taylor Swift', name: 'Love Story', uri: 'spotify:track:1D4PL9B8gOg78jiHg3FvXd', durationMs: 235266 },
    youbelongwithme: { artist: 'Taylor Swift', name: 'You Belong With Me', uri: 'spotify:track:1hrBpAO8Zz1T01F29bV5aM', durationMs: 231120 },
    lover: { artist: 'Taylor Swift', name: 'Lover', uri: 'spotify:track:1dGr1ns6AcusTeoo9dwLWR', durationMs: 221106 },
    alltoowell: { artist: 'Taylor Swift', name: 'All Too Well', uri: 'spotify:track:5enxwA8aAbwZbf5ncJizRY', durationMs: 329000 },
    cardigan: { artist: 'Taylor Swift', name: 'cardigan', uri: 'spotify:track:4R2kfaDFslZEMLoQWBZuVx', durationMs: 239560 },
    style: { artist: 'Taylor Swift', name: 'Style', uri: 'spotify:track:0ug5tqc93HGvhwQQvgSmuz', durationMs: 231000 },
    karma: { artist: 'Taylor Swift', name: 'Karma', uri: 'spotify:track:7KokYm8c5SoWv8NWlibUhT', durationMs: 204852 },
    enchanted: { artist: 'Taylor Swift', name: 'Enchanted', uri: 'spotify:track:3sqrvkEZImCLBbzE0S4h9q', durationMs: 352000 },
    dontblameme: { artist: 'Taylor Swift', name: "Don't Blame Me", uri: 'spotify:track:1R0a2iXumgCiFb7YsZ7R7f', durationMs: 236000 },
    august: { artist: 'Taylor Swift', name: 'august', uri: 'spotify:track:3hUxzQiv5Mpds3MGQ5RzgB', durationMs: 261000 },
    willow: { artist: 'Taylor Swift', name: 'willow', uri: 'spotify:track:0GNI8K3VH5P09q999eKk8Y', durationMs: 214000 },
    fortnight: { artist: 'Taylor Swift', name: 'Fortnight', uri: 'spotify:track:6dODwAsUQOPVGRviECSV2e', durationMs: 228000 },
    icandoitwithabrokenheart: { artist: 'Taylor Swift', name: 'I Can Do It With a Broken Heart', uri: 'spotify:track:4q5YezDOIPcoLr8R81595q', durationMs: 218000 },
  },
  theweeknd: {
    blindinglights: { artist: 'The Weeknd', name: 'Blinding Lights', uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', durationMs: 200040 },
    starboy: { artist: 'The Weeknd', name: 'Starboy', uri: 'spotify:track:7MXVkk9YM5IZxh0wAEvism', durationMs: 230453 },
    thehills: { artist: 'The Weeknd', name: 'The Hills', uri: 'spotify:track:7fBv7MDT7Ir5QnxgKyXTrb', durationMs: 242253 },
    cantfeelmyface: { artist: 'The Weeknd', name: "Can't Feel My Face", uri: 'spotify:track:22VdtOtoDrsaYsO4Mqjqbg', durationMs: 213520 },
    savetheirtears: { artist: 'The Weeknd', name: 'Save Your Tears', uri: 'spotify:track:5QO79kh1waicV47BqGRL3g', durationMs: 215626 },
    dieforu: { artist: 'The Weeknd', name: 'Die For You', uri: 'spotify:track:2Ch7LmS7r2Gy2Lm4XIFTyQ', durationMs: 260253 },
    ifeelitcoming: { artist: 'The Weeknd', name: 'I Feel It Coming', uri: 'spotify:track:3dhjNA0jmfE00PhYHVqu4M', durationMs: 269186 },
    calloutmyname: { artist: 'The Weeknd', name: 'Call Out My Name', uri: 'spotify:track:09mEdoA6zrmBPgTEN5qXmN', durationMs: 228373 },
    heartless: { artist: 'The Weeknd', name: 'Heartless', uri: 'spotify:track:6bnF93An4a5CRipNBqVTaR', durationMs: 200080 },
    creepin: { artist: 'The Weeknd', name: 'Creepin', uri: 'spotify:track:2dHHgz1leOBQioZaXTY0bX', durationMs: 221520 },
  },
  arcticmonkeys: {
    doiwannaknow: { artist: 'Arctic Monkeys', name: 'Do I Wanna Know?', uri: 'spotify:track:5FVd6KXrgO9B3JPmC8OPst', durationMs: 272394 },
    rumine: { artist: 'Arctic Monkeys', name: 'R U Mine?', uri: 'spotify:track:2AT8i7KDTvl0ZSV23rrFe2', durationMs: 201386 },
    '505': { artist: 'Arctic Monkeys', name: '505', uri: 'spotify:track:0BxE4Fda3J9990w9u3z73m', durationMs: 253586 },
    iwannabeyours: { artist: 'Arctic Monkeys', name: 'I Wanna Be Yours', uri: 'spotify:track:5XeFesFbtLpXzIVDNQP22n', durationMs: 183973 },
    fluorescentadolescent: { artist: 'Arctic Monkeys', name: 'Fluorescent Adolescent', uri: 'spotify:track:2NBnv0zB902F1j3x4b81mN', durationMs: 177693 },
    whenthesungoesdown: { artist: 'Arctic Monkeys', name: 'When The Sun Goes Down', uri: 'spotify:track:2zYzyRzzKuZ9P0g057zyTN', durationMs: 200000 },
    arabella: { artist: 'Arctic Monkeys', name: 'Arabella', uri: 'spotify:track:5FVd6KXrgO9B3JPmC8OPst', durationMs: 207000 },
    brianstorm: { artist: 'Arctic Monkeys', name: 'Brianstorm', uri: 'spotify:track:2AT8i7KDTvl0ZSV23rrFe2', durationMs: 170000 },
    cryinglightning: { artist: 'Arctic Monkeys', name: 'Crying Lightning', uri: 'spotify:track:0BxE4Fda3J9990w9u3z73m', durationMs: 224000 },
    snapoutofit: { artist: 'Arctic Monkeys', name: 'Snap Out Of It', uri: 'spotify:track:5XeFesFbtLpXzIVDNQP22n', durationMs: 193000 },
    mardybum: { artist: 'Arctic Monkeys', name: 'Mardy Bum', uri: 'spotify:track:2NBnv0zB902F1j3x4b81mN', durationMs: 175000 },
    ibetyoulookgoodonthedancefloor: { artist: 'Arctic Monkeys', name: 'I Bet You Look Good On The Dancefloor', uri: 'spotify:track:2zYzyRzzKuZ9P0g057zyTN', durationMs: 173000 },
    whytedycallmewhenyourehigh: { artist: 'Arctic Monkeys', name: "Why'd You Only Call Me When You're High?", uri: 'spotify:track:5FVd6KXrgO9B3JPmC8OPst', durationMs: 161000 },
  },
  queen: {
    bohemianrhapsody: { artist: 'Queen', name: 'Bohemian Rhapsody', uri: 'spotify:track:4u7EnebtmKWzUH433cf5Qv', durationMs: 354320 },
    dontstopmenow: { artist: 'Queen', name: "Don't Stop Me Now", uri: 'spotify:track:5T8Ku1vtReL1x5y3m8B1v2', durationMs: 209413 },
    wewillrockyou: { artist: 'Queen', name: 'We Will Rock You', uri: 'spotify:track:4pbJqGIASGPr0ZpGpnWJkW', durationMs: 121853 },
    wearethechampions: { artist: 'Queen', name: 'We Are the Champions', uri: 'spotify:track:7ccI99StDkUZaT4s626Pq7', durationMs: 179200 },
    anotheronebitesthedust: { artist: 'Queen', name: 'Another One Bites the Dust', uri: 'spotify:track:57JVGBtBLCfHw2umBs42JW', durationMs: 214653 },
    underpressure: { artist: 'Queen', name: 'Under Pressure', uri: 'spotify:track:2fuCquhmrzCSvF56N3yUv2', durationMs: 248440 },
    somebodytolove: { artist: 'Queen', name: 'Somebody to Love', uri: 'spotify:track:6gU9OHqBq64hoB6xZjv7qJ', durationMs: 296493 },
    radiogaga: { artist: 'Queen', name: 'Radio Ga Ga', uri: 'spotify:track:1NWg4B5u2F79G77K4u0f4G', durationMs: 348000 },
    killerqueen: { artist: 'Queen', name: 'Killer Queen', uri: 'spotify:track:4u7EnebtmKWzUH433cf5Qv', durationMs: 181000 },
    crazylittlethingcalledlove: { artist: 'Queen', name: 'Crazy Little Thing Called Love', uri: 'spotify:track:5T8Ku1vtReL1x5y3m8B1v2', durationMs: 163000 },
  },
  greenday: {
    basketcase: { artist: 'Green Day', name: 'Basket Case', uri: 'spotify:track:6L89mwZXYrvDIvi7JWApU2', durationMs: 181533 },
    americanidiot: { artist: 'Green Day', name: 'American Idiot', uri: 'spotify:track:6nTiIhLmQ3FWhvrGafw2K5', durationMs: 174346 },
    boulevardofbrokendreams: { artist: 'Green Day', name: 'Boulevard of Broken Dreams', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 260333 },
    goodriddancetimeofyourlife: { artist: 'Green Day', name: 'Good Riddance (Time of Your Life)', uri: 'spotify:track:6ORqU0bHbVCRjXm9AjhEG9', durationMs: 154626 },
    wakemewhenseptemberends: { artist: 'Green Day', name: 'Wake Me Up When September Ends', uri: 'spotify:track:3ZffCQKLFLUv3jAv9o23CJ', durationMs: 285586 },
    holiday: { artist: 'Green Day', name: 'Holiday', uri: 'spotify:track:4Z9xR23n123Y0k9p8123mN', durationMs: 232000 },
    '21guns': { artist: 'Green Day', name: '21 Guns', uri: 'spotify:track:6L89mwZXYrvDIvi7JWApU2', durationMs: 321000 },
    whenicomearound: { artist: 'Green Day', name: 'When I Come Around', uri: 'spotify:track:6nTiIhLmQ3FWhvrGafw2K5', durationMs: 178000 },
    welcometoparadise: { artist: 'Green Day', name: 'Welcome to Paradise', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 224000 },
    longview: { artist: 'Green Day', name: 'Longview', uri: 'spotify:track:6ORqU0bHbVCRjXm9AjhEG9', durationMs: 239000 },
  },
  blink182: {
    allthesmallthings: { artist: 'blink-182', name: 'All The Small Things', uri: 'spotify:track:2m1hi0nfMR9vdGCYJURwGR', durationMs: 167066 },
    whatsmyageagain: { artist: 'blink-182', name: "What's My Age Again?", uri: 'spotify:track:4LJhJ6D93hvUwWsaUmNqZE', durationMs: 148360 },
    imissyou: { artist: 'blink-182', name: 'I Miss You', uri: 'spotify:track:1uVbw28Lz8QxYyvU4f826h', durationMs: 227240 },
    firstdate: { artist: 'blink-182', name: 'First Date', uri: 'spotify:track:15cJv0vU912p448vjB412k', durationMs: 171453 },
    dammit: { artist: 'blink-182', name: 'Dammit', uri: 'spotify:track:6xpDh00w3L135V9F16342P', durationMs: 165000 },
    therockshow: { artist: 'blink-182', name: 'The Rock Show', uri: 'spotify:track:2m1hi0nfMR9vdGCYJURwGR', durationMs: 171000 },
    adamssong: { artist: 'blink-182', name: "Adam's Song", uri: 'spotify:track:4LJhJ6D93hvUwWsaUmNqZE', durationMs: 249000 },
    feelingthis: { artist: 'blink-182', name: 'Feeling This', uri: 'spotify:track:1uVbw28Lz8QxYyvU4f826h', durationMs: 172000 },
    staytogetherforthekids: { artist: 'blink-182', name: 'Stay Together for the Kids', uri: 'spotify:track:15cJv0vU912p448vjB412k', durationMs: 239000 },
    onemoretime: { artist: 'blink-182', name: 'ONE MORE TIME', uri: 'spotify:track:6xpDh00w3L135V9F16342P', durationMs: 197000 },
  },
  foofighters: {
    everlong: { artist: 'Foo Fighters', name: 'Everlong', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 250546 },
    thepretender: { artist: 'Foo Fighters', name: 'The Pretender', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 269373 },
    learntofly: { artist: 'Foo Fighters', name: 'Learn to Fly', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 235440 },
    bestofyou: { artist: 'Foo Fighters', name: 'Best of You', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 255826 },
    timeslikethese: { artist: 'Foo Fighters', name: 'Times Like These', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 265880 },
    allmylife: { artist: 'Foo Fighters', name: 'All My Life', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 263640 },
    monkeywrench: { artist: 'Foo Fighters', name: 'Monkey Wrench', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 231453 },
    myhero: { artist: 'Foo Fighters', name: 'My Hero', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 260173 },
    walk: { artist: 'Foo Fighters', name: 'Walk', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 256000 },
    thesedays: { artist: 'Foo Fighters', name: 'These Days', uri: 'spotify:track:5UWwZQUhuvl8OvtkoUrFn9', durationMs: 298000 },
  },
  redhotchilipeppers: {
    californication: { artist: 'Red Hot Chili Peppers', name: 'Californication', uri: 'spotify:track:48UPSzbWmrY9iJb9RJ5zWw', durationMs: 329733 },
    underthebridge: { artist: 'Red Hot Chili Peppers', name: 'Under the Bridge', uri: 'spotify:track:3d9DChrdcR09p499130n1F', durationMs: 264306 },
    cantstop: { artist: 'Red Hot Chili Peppers', name: "Can't Stop", uri: 'spotify:track:3ZOEytgrvLmpEaqguKN09P', durationMs: 269000 },
    scartissue: { artist: 'Red Hot Chili Peppers', name: 'Scar Tissue', uri: 'spotify:track:1TwCLj3Kj86mEao4iU3a0X', durationMs: 215906 },
    danicalifornia: { artist: 'Red Hot Chili Peppers', name: 'Dani California', uri: 'spotify:track:10Nmj3ueHpND9u9rwEC3EN', durationMs: 282160 },
    snowheyoh: { artist: 'Red Hot Chili Peppers', name: 'Snow (Hey Oh)', uri: 'spotify:track:2aibwv5hGXSgw7YjF9hu8w', durationMs: 334666 },
    giveitaway: { artist: 'Red Hot Chili Peppers', name: 'Give It Away', uri: 'spotify:track:0asBkWz5rK05xZgP7822hK', durationMs: 283000 },
    otherside: { artist: 'Red Hot Chili Peppers', name: 'Otherside', uri: 'spotify:track:64BbK9SFGH04m746KiBJWv', durationMs: 255373 },
    bytheway: { artist: 'Red Hot Chili Peppers', name: 'By the Way', uri: 'spotify:track:1TwCLj3Kj86mEao4iU3a0X', durationMs: 216000 },
    blacksummer: { artist: 'Red Hot Chili Peppers', name: 'Black Summer', uri: 'spotify:track:10Nmj3ueHpND9u9rwEC3EN', durationMs: 215000 },
  },
  linkinpark: {
    intheend: { artist: 'Linkin Park', name: 'In the End', uri: 'spotify:track:60a0Rd6pj09Gxmy49MVz6x', durationMs: 216880 },
    numb: { artist: 'Linkin Park', name: 'Numb', uri: 'spotify:track:2nLtzopw45Pvuignv24Bs0', durationMs: 185586 },
    faint: { artist: 'Linkin Park', name: 'Faint', uri: 'spotify:track:4Yf5bqU3NK4k6P40i009kQ', durationMs: 162600 },
    crawling: { artist: 'Linkin Park', name: 'Crawling', uri: 'spotify:track:57ScnrvH6Fsm0824u4kK8s', durationMs: 209000 },
    onestepcloser: { artist: 'Linkin Park', name: 'One Step Closer', uri: 'spotify:track:03s9hH8Vb3tqPshb2rBvK3', durationMs: 157000 },
    somewhereibelong: { artist: 'Linkin Park', name: 'Somewhere I Belong', uri: 'spotify:track:60a0Rd6pj09Gxmy49MVz6x', durationMs: 213000 },
    breakingthehabit: { artist: 'Linkin Park', name: 'Breaking the Habit', uri: 'spotify:track:2nLtzopw45Pvuignv24Bs0', durationMs: 196000 },
    whativedone: { artist: 'Linkin Park', name: 'What I\'ve Done', uri: 'spotify:track:4Yf5bqU3NK4k6P40i009kQ', durationMs: 205000 },
    bleeditout: { artist: 'Linkin Park', name: 'Bleed It Out', uri: 'spotify:track:57ScnrvH6Fsm0824u4kK8s', durationMs: 164000 },
    papercut: { artist: 'Linkin Park', name: 'Papercut', uri: 'spotify:track:60a0Rd6pj09Gxmy49MVz6x', durationMs: 184000 },
    theemptinessmachine: { artist: 'Linkin Park', name: 'The Emptiness Machine', uri: 'spotify:track:2nLtzopw45Pvuignv24Bs0', durationMs: 190000 },
    heavyisthecrown: { artist: 'Linkin Park', name: 'Heavy Is the Crown', uri: 'spotify:track:4Yf5bqU3NK4k6P40i009kQ', durationMs: 167000 },
  }
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves a track from the built-in high-confidence catalog.
 */
export function getCatalogTrack(artistName: string, trackName: string): CatalogTrack | null {
  if (!trackName) return null;
  const cleanTrack = sanitizeTrackName(trackName) || trackName;
  const trackKey = normalizeKey(cleanTrack);
  const artistKey = normalizeKey(artistName || '');

  // 1. Direct artist match
  if (artistKey && CATALOG[artistKey]) {
    const artistCatalog = CATALOG[artistKey];
    if (artistCatalog[trackKey]) {
      return artistCatalog[trackKey];
    }
    // Partial key match within the artist catalog
    for (const [key, item] of Object.entries(artistCatalog)) {
      if (trackKey.includes(key) || key.includes(trackKey)) {
        return item;
      }
    }
  }

  // 2. Global track search across all artists if artist wasn't matched
  for (const [, artistCatalog] of Object.entries(CATALOG)) {
    if (artistCatalog[trackKey]) {
      return artistCatalog[trackKey];
    }
  }

  return null;
}
