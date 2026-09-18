export const ITEMS=[
'Longsword','Dagger','Battle axe','Wooden club','Mace','Spear','Bow','Crossbow','Quiver','Round shield',
'Helmet','Boots','Gloves','Chainmail','Leather armour','Red cloak','Wizard hat','Staff','Spellbook','Wand',
'Red potion','Blue potion','Green potion','Purple potion','Amber potion','Glass vial','Clay flask','Canteen','Poison','Bandages',
'Gold coins','Coin purse','Ruby','Sapphire','Emerald','Ring','Necklace','Crown','Goblet','Statuette',
'Iron key','Key ring','Padlock','Scroll','Sealed letter','Map','Journal','Quill and ink','Seal stamp','Hourglass',
'Treasure chest','Barrel','Crate','Sack','Basket','Backpack','Bedroll','Rope','Ladder','Bear trap',
'Torch','Lantern','Candle','Candle holder','Oil lamp','Campfire','Firewood','Coal','Tinderbox','Brazier',
'Bread','Cheese','Apples','Roast meat','Fish','Mushrooms','Herbs','Grain','Jug','Bowl',
'Hammer','Tongs','Anvil','Pickaxe','Shovel','Saw','Sickle','Pitchfork','Bucket','Handcart',
'Skull','Bones','Antlers','Purple crystal','Dragon egg','Feather','Seashell','Pelt','Sundial','Ritual stone'];
export const ITEM_ATLAS='./assets/items.png';
const columns=[0,126,250,376,500,628,752,878,1004,1128,1254],rows=[0,139,271,393,517,647,759,891,1007,1133,1254];
export function itemAsset(index){const c=index%10,r=Math.floor(index/10);return {url:ITEM_ATLAS,crop:[columns[c]/1254,rows[r]/1254,(columns[c+1]-columns[c])/1254,(rows[r+1]-rows[r])/1254]};}
