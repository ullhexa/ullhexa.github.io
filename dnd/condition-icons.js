// One consistent, scalable icon family for the condition menu and token badges.
const icons={
  blinded:['#b7a6e8','M2 12Q12 1 22 12Q12 23 2 12M4 21 20 3'],
  charmed:['#f48ab6','M12 21 3 12C-2 4 8 0 12 7C16 0 26 4 21 12Z'],
  deafened:['#7dbbdd','M7 8C7 0 20 0 20 9C20 14 14 14 14 18C14 23 7 23 7 18M3 3 21 21'],
  exhaustion:['#d6a36e','M5 2H19M5 22H19M6 2C6 9 18 15 18 22M18 2C18 9 6 15 6 22M8 19H16'],
  frightened:['#efb45e','M4 20V10C4 0 20 0 20 10V20L16 17 12 21 8 17ZM8 9V11M16 9V11M10 15H14'],
  grappled:['#cc9375','M4 8V14C4 22 15 22 15 14V8M1 8H7M12 8H18M9 3V9C9 17 21 17 21 9V3'],
  incapacitated:['#ed8b85','M4 4H20V20H4ZM8 8 16 16M16 8 8 16'],
  invisible:['#9bcad5','M7 3 10 2M15 2 18 4M21 8 22 11M22 15 20 18M16 21 13 22M8 21 5 19M2 15 2 12M3 7 4 5'],
  paralyzed:['#ebcb68','M8 2 4 12H10L8 22 20 9H13L16 2Z'],
  petrified:['#b4babf','M6 2H17L22 10 17 22H5L2 12ZM6 2 11 10 5 22M11 10 22 10M11 10 17 22'],
  poisoned:['#8acb79','M9 2H15M10 2V9L4 18Q2 22 7 22H17Q22 22 20 18L14 9V2M7 15H17'],
  prone:['#dbaa7a','M2 21H22M5 16H15L19 19M9 16 13 11 18 12M3 11A2 2 0 1 0 7 11A2 2 0 1 0 3 11'],
  restrained:['#c6a0d4','M7 7H5A5 5 0 0 0 5 17H10M17 7H19A5 5 0 0 1 19 17H14M7 12H17'],
  stunned:['#eee090','M12 1 15 8 23 12 15 15 12 23 9 15 1 12 9 8Z'],
  unconscious:['#91a6e4','M17 2A10 10 0 1 0 22 17A10 10 0 0 1 17 2Z']
};
export function conditionIcon(id){const[color,path]=icons[id]||icons.stunned;const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('condition-icon');svg.style.color=color;p.setAttribute('d',path);svg.append(p);return svg;}
