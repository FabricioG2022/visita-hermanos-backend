// Curada lista de versículos diarios en español (Reina-Valera 1960 / NVI)
const DAILY_VERSES = [
  {
    reference: "Filipenses 4:13",
    text: "Todo lo puedo en Cristo que me fortalece.",
    theme: "Fortaleza",
    reflection: "Recuerda que no caminas solo; en cada desafío, Cristo es tu fuente inagotable de fuerza y victoria."
  },
  {
    reference: "Salmos 23:1",
    text: "El Señor es mi pastor; nada me faltará.",
    theme: "Confianza",
    reflection: "Dios cuida minuciosamente de cada una de tus necesidades cotidianas. Descansa en su fidelidad."
  },
  {
    reference: "Jeremías 29:11",
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    theme: "Esperanza",
    reflection: "Los planes de Dios para tu vida son siempre de bendición y esperanza, aun en medio de la incertidumbre."
  },
  {
    reference: "Proverbios 3:5-6",
    text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
    theme: "Sabiduría",
    reflection: "Entregar el control a Dios abre el camino para su dirección perfecta en cada decisión."
  },
  {
    reference: "Isaías 40:31",
    text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.",
    theme: "Renovación",
    reflection: "Renueva tus fuerzas hoy en la presencia del Señor; Él restaura el alma cansada."
  },
  {
    reference: "Romanos 8:28",
    text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
    theme: "Propósito",
    reflection: "Cada situación por la que atraviesas está siendo obrada por Dios para tu bien supremo."
  },
  {
    reference: "Salmos 46:1",
    text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.",
    theme: "Protección",
    reflection: "En los momentos de tormenta, Dios es el refugio inexpugnable donde encuentras paz sólida."
  },
  {
    reference: "Juan 3:16",
    text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    theme: "Amor Incondicional",
    reflection: "El amor de Dios hacia ti se demostró en el regalo más grande: la vida y salvación en Jesús."
  },
  {
    reference: "Mateo 11:28",
    text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    theme: "Descanso",
    reflection: "Jesús te invita hoy a depositar tus cargas en Él para experimentar un descanso verdadero."
  },
  {
    reference: "Josué 1:9",
    text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.",
    theme: "Valentía",
    reflection: "Afronta este día con valentía, sabiendo que la presencia de Dios va contigo a cada paso."
  },
  {
    reference: "Salmos 119:105",
    text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
    theme: "Guía",
    reflection: "La Palabra de Dios ilumina tus decisiones y despeja la oscuridad del camino."
  },
  {
    reference: "Gálatas 5:22-23",
    text: "Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.",
    theme: "Fruto del Espíritu",
    reflection: "Permite que el Espíritu Santo moldee hoy en tu corazón la paz, la amabilidad y la paciencia."
  },
  {
    reference: "2 Timoteo 1:7",
    text: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.",
    theme: "Poder y Paz",
    reflection: "El temor no tiene lugar en tu vida; Dios te ha revestido de poder, amor y mente sana."
  },
  {
    reference: "1 Corintios 13:13",
    text: "Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.",
    theme: "Amor",
    reflection: "El amor genuino hacia Dios y hacia tus hermanos es la fuerza transformadora más poderosa."
  },
  {
    reference: "Salmos 100:5",
    text: "Porque Jehová es bueno; para siempre es su misericordia, y su verdad por todas las generaciones.",
    theme: "Gratitud",
    reflection: "La bondad de Dios dura por siempre. Tómate un momento hoy para darle gracias."
  }
];

// Calcula el versículo del día según la fecha (día del año) evitando desfase horaria
const getDailyVerse = (req, res) => {
  try {
    const { date } = req.query;
    let targetDate;

    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      } else {
        targetDate = new Date();
      }
    } else {
      targetDate = new Date();
    }

    // Calcular día del año (0-365)
    const start = new Date(targetDate.getFullYear(), 0, 0);
    const diff = targetDate - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = Math.abs(dayOfYear) % DAILY_VERSES.length;
    const selectedVerse = DAILY_VERSES[index];

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateIso = `${year}-${month}-${day}`;

    const formattedDate = targetDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.json({
      dateIso,
      formattedDate,
      ...selectedVerse,
      version: "RVR1960"
    });
  } catch (error) {
    console.error('Error al obtener versículo del día:', error);
    res.status(500).json({ message: 'Error al consultar versículo del día' });
  }
};

module.exports = { getDailyVerse };
