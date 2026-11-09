export const sarees = [
  {id:'rose', name:'Muhurtham Rose', price:18900, fabric:'Kanchipuram Silk', note:'Antique gold border and a contrasting pallu', color:'#943545', mood:'Wedding Edit', tags:['Zari & Brocade'], offer:10},
  {id:'forest', name:'Temple Emerald', price:16400, fabric:'Kanchipuram Silk', note:'Forest green with a temple gold border', color:'#386052', mood:'Kanchipuram Icons', tags:['Zari & Brocade']},
  {id:'ivory', name:'Ivory Heirloom', price:17400, fabric:'Banarasi Silk', note:'Ivory ground with scattered gold motifs', color:'#cc984b', mood:'Banarasi Heirlooms', tags:['Zari & Brocade']},
  {id:'saffron', name:'Saffron Hour', price:11900, fabric:'Silk Half Saree', note:'Saffron drape with a contrasting teal blouse', color:'#b34d2f', mood:'Festive Radiance', tags:['Half Sarees']},
  {id:'plum', name:'Brocade Nocturne', price:15400, fabric:'Brocade Silk', note:'Deep plum with a patterned gold pallu', color:'#5b356c', mood:'Zari Signatures', tags:['Zari & Brocade']},
  {id:'blue', name:'Palace Check', price:13900, fabric:'Checked Silk', note:'Indigo field with a fine gold grid', color:'#24446e', mood:'Checked Classics', tags:['Checked Sarees']},
  {id:'magenta', name:'Kanchi Rani', price:18200, fabric:'Kanchipuram Silk', note:'Magenta and emerald with a bold zari border', color:'#a5215b', tags:['Zari & Brocade'], offer:8},
  {id:'gold', name:'Manjal Kalyanam', price:21900, fabric:'Kanchipuram Silk', note:'Mustard silk with a crimson wedding pallu', color:'#a66b25', tags:['Zari & Brocade'], offer:12},
].map(item => ({...item, model:true, category:item.tags.includes('Half Sarees') ? 'Half Sarees' : 'Silk Sarees'}));

export const blouses = [
  {id:'wine-blouse', name:'Wine Silk Blouse', price:1850, fabric:'Silk', note:'Fitted silk blouse with a round neckline', category:'Blouses', color:'#943545', tags:[]},
  {id:'gold-blouse', name:'Saffron Silk Blouse', price:1650, fabric:'Silk', note:'Fitted silk blouse with a warm gold finish', category:'Blouses', color:'#b98134', tags:[]},
];

export const accessories = [
  {id:'choker', name:'Temple Choker', price:2200, symbol:'♧'},
  {id:'jhumkas', name:'Gold-tone Jhumkas', price:1150, symbol:'◈'},
  {id:'belt', name:'Ottiyanam Waist Belt', price:1800, symbol:'◇'},
  {id:'bangles', name:'Antique Finish Bangles', price:950, symbol:'◎'},
];
export const rack = [...sarees, ...blouses];
export const products = Object.fromEntries([...rack, ...accessories].map(item => [item.id, item]));
export const moods = [0, 1, 2, 3, 4, 7].map((i,j) => ({...sarees[i], label:j === 5 ? 'Bridal Edit' : sarees[i].mood}));
export const bridal = [sarees[0], sarees[4], sarees[7], sarees[6], sarees[2]];
export const reels = [
  {product:sarees[0], title:'The Rose Drape', scene:'The bridal studio'},
  {product:sarees[1], title:'Temple Emerald', scene:'The colour studio'},
  {product:sarees[2], title:'Ivory in Light', scene:'The daylight studio'},
  {product:sarees[3], title:'Saffron Hour', scene:'The festive studio'},
  {product:sarees[4], title:'Brocade After Dark', scene:'The evening studio'},
];
