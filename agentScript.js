/**
 * Script and detection rules for the AI Safety Agent.
 *
 * The agent in this MVP is deterministic: phrase matching plus a timer-driven
 * check-in loop. That is on purpose. For a safety feature, a rule you can read,
 * test and prove beats a model you have to trust — the LLM layer belongs on top
 * of this, for conversation quality, not underneath it, for escalation logic.
 */

/** Phrases that escalate. `severity: 'critical'` fires SOS with no countdown. */
export const TRIGGER_PHRASES = [
  {
    id: 'safespark-help',
    severity: 'critical',
    phrases: ['safespark help', 'safe spark help', 'spark help me'],
    label: 'Direct help command',
    response:
      "I heard you. Sending your live location to your contacts now. Say the word and I'll sound the alarm too.",
  },
  {
    id: 'being-followed',
    severity: 'critical',
    phrases: [
      "i'm being followed",
      'im being followed',
      'someone is following me',
      "someone's following me",
      'he is following me',
      'they are following me',
    ],
    label: 'Being followed',
    response:
      "Staying with you. I'm alerting your contacts and sharing your live location. Head for the nearest lit building entrance — I'm putting it on your map.",
  },
  {
    id: 'call-911',
    severity: 'critical',
    phrases: ['call 911', 'call nine one one', 'call the police'],
    label: 'Emergency dial request',
    response: 'Opening your emergency dial and alerting your trusted contacts.',
  },
  {
    id: 'leave-me-alone',
    severity: 'elevated',
    phrases: ['leave me alone', 'get away from me', 'stop following me', 'back off'],
    label: 'Confrontation detected',
    response:
      "That sounded like a confrontation. I'm recording the transcript and I'm one word from sending your location — say \"SafeSpark help\" and I go.",
  },
  {
    id: 'generic-help',
    severity: 'elevated',
    phrases: ['help me', 'i need help', 'i am scared', "i'm scared", 'im scared'],
    label: 'Distress language',
    response:
      "I'm here. Do you want me to alert your contacts? Say \"SafeSpark help\" and I'll send everything right now.",
  },
];

/** Phrases that stand the agent down. */
export const SAFE_PHRASES = [
  "i'm home",
  'im home',
  "i'm safe",
  'im safe',
  'all good',
  'false alarm',
  'i made it',
  'stand down',
];

/** Agent lines during a normal, uneventful walk. */
export const AMBIENT_LINES = [
  'Still tracking. Your route is lit the whole way from here.',
  "You're about halfway. Two blue lights within 200 feet if you want them.",
  'Nothing new reported on your route in the last hour.',
  'Pace looks steady. I\'ll check in again shortly.',
  "There's a working blue light at the next corner — I'll call it out as you pass.",
];

/** What the simulated microphone "hears" when real speech recognition is unavailable. */
export const SIMULATED_HEARD = [
  'okay I just crossed tenth street',
  'it is really dark over here',
  'almost at the dorm',
  'there is someone behind me',
  'I think I am fine',
];

/**
 * Fake Phone Call Mode.
 *
 * Designed to sound like a friend who knows exactly where you are and is
 * arriving imminently — the two things that make a watcher reconsider. `you`
 * lines are prompts shown on screen for the user to say out loud.
 */
export const FAKE_CALL_SCRIPT = [
  { from: 'caller', text: "Hey! I was about to call you. Where are you right now?", pause: 900 },
  { from: 'you', text: 'Just coming up on the corner — two minutes out.', pause: 2600 },
  {
    from: 'caller',
    text: "Perfect, I'm already parked. I can see the crosswalk from here, I'll flash the lights.",
    pause: 1000,
  },
  { from: 'you', text: 'Okay, I see you. Stay on the line.', pause: 2400 },
  {
    from: 'caller',
    text: "Not going anywhere. Dad's with me too, he wanted to say hi. Keep walking, you're almost at the car.",
    pause: 1000,
  },
  { from: 'you', text: 'Almost there.', pause: 2200 },
  {
    from: 'caller',
    text: "Take your time. I'll stay on until you're in. Anybody near you right now?",
    pause: 1000,
  },
  { from: 'you', text: 'No, I think I\'m good.', pause: 2400 },
  {
    from: 'caller',
    text: "Good. I'm watching the street the whole way — just come straight to me.",
    pause: 1200,
  },
];
