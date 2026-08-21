import type { Scenario } from '../types'

export const scenarios: Scenario[] = [
  {
    id: 'free',
    title: 'Daily conversation',
    titlePt: 'Conversa cotidiana',
    blurb: 'Fale sobre o seu dia. A Maya corrige e continua o papo.',
    icon: '🏠',
    prompt:
      'Free everyday conversation. Be a friendly tutor-partner. Ask about the student’s day, plans, food, work and feelings. Keep it natural.',
    starters: ['What did you do today?', 'How was your morning?', 'Tell me about your week.'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    titlePt: 'Restaurante',
    blurb: 'Peça uma mesa, escolha o prato e fale com o garçom.',
    icon: '🍔',
    prompt:
      'Role-play: you are a waiter in a casual American restaurant. Take the order, offer drinks and dessert, and make light small talk.',
    starters: ['A table for one, please.', 'What do you recommend?', 'Can I have the check, please?'],
  },
  {
    id: 'airport',
    title: 'Airport',
    titlePt: 'Aeroporto',
    blurb: 'Check-in, portão, atraso e bagagem — como na vida real.',
    icon: '✈️',
    prompt:
      'Role-play: you are an airport agent. Help with check-in, gates, delays or lost bags. Speak clearly, one step at a time.',
    starters: ['I need to catch a flight.', 'Where is gate B12?', 'My suitcase didn’t arrive.'],
  },
  {
    id: 'hotel',
    title: 'Hotel',
    titlePt: 'Hotel',
    blurb: 'Check-in, Wi-Fi, toalhas extras e um problema no quarto.',
    icon: '🏨',
    prompt:
      'Role-play: you are a hotel receptionist. Help with the reservation, room requests and small problems.',
    starters: ['I have a reservation.', 'Is breakfast included?', 'The air conditioning isn’t working.'],
  },
  {
    id: 'interview',
    title: 'Job interview',
    titlePt: 'Entrevista de emprego',
    blurb: 'Apresente-se, fale de experiência e responda perguntas clássicas.',
    icon: '💼',
    prompt:
      'Role-play: you are a kind interviewer. Ask one question at a time about experience, strengths and teamwork. Give brief spoken feedback.',
    starters: ['Hello, thanks for having me.', 'I am excited about this role.', 'Can you tell me about the team?'],
  },
  {
    id: 'market',
    title: 'Grocery store',
    titlePt: 'Mercado',
    blurb: 'Ache produtos, pergunte preço e fale no caixa.',
    icon: '🛒',
    prompt:
      'Role-play: you work at a supermarket. Help the student find items, talk about prices, quantities and the checkout.',
    starters: ['Excuse me, where is the milk?', 'How much is this?', 'Do you have this in a bigger size?'],
  },
  {
    id: 'dating',
    title: 'Date',
    titlePt: 'Encontro',
    blurb: 'Conversa leve, elogios naturais e um segundo encontro.',
    icon: '❤️',
    prompt:
      'Role-play: a relaxed first date. Be kind and interested. Keep topics light: food, music, travel, hobbies.',
    starters: ['Thanks for meeting me.', 'Have you been here before?', 'What kind of music do you like?'],
  },
  {
    id: 'gaming',
    title: 'Playing with friends',
    titlePt: 'Jogando com amigos',
    blurb: 'Call, estratégia, vitória e “gg” em inglês de verdade.',
    icon: '🎮',
    prompt:
      'Role-play: you are a friend in a voice chat during a game. Use casual English, short turns, and game talk (ready, wait, nice shot) without being toxic.',
    starters: ['Are you ready?', 'Wait, I need backup.', 'That was a nice shot!'],
  },
  {
    id: 'phone',
    title: 'Phone call',
    titlePt: 'Ligação telefônica',
    blurb: 'Marque horário, peça para repetir e deixe recado.',
    icon: '📞',
    prompt:
      'Role-play: a phone call. Speak in short turns. Offer to repeat or speak slower. You may be a receptionist, a friend or customer service.',
    starters: ['Hi, I’m calling to book an appointment.', 'Sorry, could you repeat that?', 'Can I leave a message?'],
  },
  {
    id: 'american',
    title: 'Talking with an American',
    titlePt: 'Conversando com um americano',
    blurb: 'Small talk, gírias leves e o ritmo de uma conversa nos EUA.',
    icon: '🇺🇸',
    prompt:
      'Role-play: you are a friendly American meeting the student. Use natural US English, light slang at B1+, and typical small talk (weather, weekend, food, work).',
    starters: ['Hey, how’s it going?', 'What do you do for fun?', 'You hungry? There’s a good place nearby.'],
  },
]

export function getScenario(id: string): Scenario {
  return scenarios.find((item) => item.id === id) ?? scenarios[0]
}
