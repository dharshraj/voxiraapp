/**
 * Static educational content for the TopicDetailScreen.
 * Each topic has a title, subtitle, sections with headings + body text,
 * and optional bullet-point lists.
 */

export interface TopicSection {
  heading: string;
  body:    string;
  bullets?: string[];
}

export interface TopicContent {
  id:       string;
  title:    string;
  subtitle: string;
  icon:     string;
  color:    string;
  readTime: string;
  sections: TopicSection[];
}

export const TOPIC_CONTENT: Record<string, TopicContent> = {

  // ── Speech Clarity ──────────────────────────────────────────────────────────
  'Speech clarity': {
    id: 'speech-clarity',
    title: 'Speech Clarity',
    subtitle: 'How to make every word land',
    icon: 'mic-outline',
    color: '#0369A1',
    readTime: '5 min read',
    sections: [
      {
        heading: 'What clarity actually means',
        body: 'Speech clarity is the degree to which a listener can understand each word you say without effort. It is different from volume — you can speak loudly and still be unclear. True clarity comes from precise articulation, appropriate pace, and intentional breath control working together.',
      },
      {
        heading: 'Why clarity breaks down',
        body: 'Most clarity problems stem from a few root causes: speaking too fast for your mouth to keep up, lazy lip and tongue movement, dropping the ends of sentences, and poor breath support that causes words to blur together. The good news is all of these are trainable habits, not fixed traits.',
      },
      {
        heading: 'Articulation exercises',
        body: 'Your mouth is a muscle group. Like any muscle, deliberate training sharpens it.',
        bullets: [
          'Tongue twisters: "Red lorry, yellow lorry" — say it slowly first, then increase speed over weeks',
          'Lip trills: flutter your lips while humming a scale to loosen lip tension before speaking',
          'Exaggerated mouth opening: read a paragraph aloud while deliberately over-opening your jaw — this trains muscle memory',
          '"The mouth is a megaphone" drill: speak as if the back row of a 200-seat room needs to hear you clearly, even in a quiet room',
          'Consonant drills: pick a letter (e.g. "T") and read sentences focusing on crisp, clean stops for that sound',
        ],
      },
      {
        heading: 'Slowing down is not enough — enunciate',
        body: 'Many people think slowing down fixes clarity. It helps, but only if you also enunciate. Enunciation means completing each consonant fully — especially final consonants like T, D, K, and G. English speakers commonly drop these in casual speech. "I wanna go" instead of "I want to go." In professional or high-stakes contexts, complete those sounds.',
      },
      {
        heading: 'Breath support and posture',
        body: 'Breath is the engine behind clear speech. If you run out of breath mid-sentence, your voice weakens and words blur. Practise diaphragmatic breathing: place a hand on your stomach and breathe so your hand moves outward, not your chest. Speak on the outward breath, not the inward. Sit or stand tall — slouching compresses your diaphragm and reduces breath capacity by up to 30%.',
      },
      {
        heading: 'Common clarity mistakes to audit',
        body: 'Record yourself for two minutes on any topic, then listen back specifically for these:',
        bullets: [
          'Dropped word endings ("goin" instead of "going", "an" instead of "and")',
          'Blended words running together ("Idunno", "Whatcha", "Gonna")',
          'Rising intonation at sentence ends — makes statements sound like questions and reduces authority',
          'Mumbling on long words — break polysyllabic words into parts during practice',
          'Inconsistent volume — trailing off at sentence ends',
        ],
      },
      {
        heading: 'A daily 5-minute clarity routine',
        body: 'Consistency beats intensity. Five minutes daily produces more improvement than an hour once a week.',
        bullets: [
          'Minute 1: lip trills and jaw stretches',
          'Minute 2: one tongue twister, slow then fast',
          'Minutes 3–4: read a paragraph of any article aloud with deliberate enunciation',
          'Minute 5: record yourself speaking naturally and compare to yesterday',
        ],
      },
    ],
  },

  // ── Reduce Filler Words ─────────────────────────────────────────────────────
  'Reduce filler words': {
    id: 'reduce-fillers',
    title: 'Reduce Filler Words',
    subtitle: 'Replace um and uh with confident silence',
    icon: 'warning-outline',
    color: '#B45309',
    readTime: '5 min read',
    sections: [
      {
        heading: 'Why filler words happen',
        body: 'Filler words — um, uh, like, you know, basically, literally, right? — are not random. They appear at the precise moment your brain is searching for the next word or thought. The mouth is faster than the mind can retrieve language, so it inserts a placeholder sound to hold the floor. Understanding this is key: fillers are not a sign of low intelligence. They are a gap-filling habit, and habits can be replaced.',
      },
      {
        heading: 'The cost of excessive fillers',
        body: 'Research on listener perception shows that speakers who use more than 5 filler words per minute are rated as less credible, less prepared, and less authoritative — even when the content is identical. In job interviews, presentations, and leadership conversations, this perception gap has real consequences. Eliminating fillers is one of the highest-return communication improvements you can make.',
      },
      {
        heading: 'The pause technique — the core fix',
        body: 'The single most effective replacement for a filler word is a deliberate pause. When you feel an "um" coming, close your mouth and breathe through your nose for one second. To a listener, a confident pause signals thoughtfulness. An "um" signals uncertainty. The silence feels longer to you than to your audience — because you are inside your own head. Trust the pause.',
        bullets: [
          'Replace every "um" with a closed-mouth, one-second pause',
          'Replace "you know what I mean?" with eye contact and a beat of silence',
          'Replace "basically" (a throat-clearer before the real point) by just starting with the real point',
          'Replace "literally" and "actually" (which add no information) with nothing at all',
        ],
      },
      {
        heading: 'Awareness first: the recording method',
        body: 'You cannot reduce what you cannot hear. Most people are genuinely unaware of how many fillers they use. The most powerful step is to record yourself for two to five minutes speaking naturally — a practice pitch, a voice note, a mock interview answer. Then count every filler. Write down the total. Repeat weekly and track the number going down. Awareness alone reduces filler use by 40–60% within two weeks.',
      },
      {
        heading: 'Structural causes and how to address them',
        body: 'Fillers spike in predictable situations:',
        bullets: [
          'Transition points between ideas — practise linking phrases like "Building on that..." or "The second point is..."',
          'When asked an unexpected question — it is acceptable to say "Give me a moment to think" instead of filling with ums',
          'At the start of sentences — train yourself to pause before speaking rather than launching with "So um..."',
          'When nervous — adrenaline speeds up speech; consciously slow down at the first sign of fillers',
        ],
      },
      {
        heading: 'Practice exercises',
        body: 'These exercises directly build the pause-instead-of-fill habit:',
        bullets: [
          'The penalty jar: put a coin in a jar every time you catch yourself using a filler. Empty the jar weekly as a ritual.',
          'Partner feedback: ask a trusted person to snap their fingers every time you use a filler during a 5-minute conversation',
          'Structured monologue: speak on any topic for 60 seconds with a goal of zero fillers — stop and restart when one appears',
          'Voxira analysis: use the speech analysis tool to get an exact count after each session and track improvement over time',
          'Prepared speech without notes: the more you know your material, the fewer filler gaps appear',
        ],
      },
      {
        heading: 'Realistic expectations',
        body: 'Eliminating fillers completely is not the goal — that would make speech sound robotic. The goal is deliberate control. A speaker who uses 1–2 fillers per minute sounds natural and thoughtful. A speaker who uses 8–10 per minute sounds unprepared. Most people can get from high-filler to low-filler in 3–4 weeks of daily awareness practice.',
      },
    ],
  },

  // ── Pronunciation ───────────────────────────────────────────────────────────
  'Pronunciation': {
    id: 'pronunciation',
    title: 'Pronunciation',
    subtitle: 'Speak with precision and confidence',
    icon: 'volume-high-outline',
    color: '#15803D',
    readTime: '5 min read',
    sections: [
      {
        heading: 'Pronunciation vs. accent',
        body: 'Pronunciation refers to whether individual sounds within a language are produced correctly. Accent refers to the overall rhythmic and phonetic pattern of a regional variety. You do not need to lose your accent to improve pronunciation. The goal is to produce the sounds of English clearly enough that your meaning is never in doubt — not to sound like a BBC newsreader.',
      },
      {
        heading: 'The sounds most commonly mispronounced in English',
        body: 'Certain phonemes cause consistent difficulty:',
        bullets: [
          'TH sounds: "think" (unvoiced, tongue between teeth) vs "this" (voiced). Many speakers substitute T/D or S/Z.',
          'V vs W: "very" and "wary" are distinct. V requires upper teeth on lower lip; W is lip rounding only.',
          'Schwa vowel (uh sound): the most common vowel in English — "about", "problem", "moment" — often over-pronounced by non-native speakers.',
          'Short vowels: "ship" vs "sheep", "bit" vs "beat" — vowel length matters in English.',
          'Word-final consonants: "-ed" endings (/t/, /d/, or /ɪd/), "-s" endings (/s/, /z/, or /ɪz/) — each has a rule.',
        ],
      },
      {
        heading: 'Minimal pairs training',
        body: 'Minimal pairs are words that differ by only one sound: "bit/beat", "ship/sheep", "thin/tin", "rice/lice". Training with minimal pairs is the fastest way to sharpen phonemic discrimination. Say each pair aloud, record yourself, compare to a native model, and repeat until the distinction is automatic. Many free minimal pairs resources are available online.',
      },
      {
        heading: 'Shadowing technique',
        body: 'Shadowing is one of the most evidence-backed pronunciation training methods. Listen to a short audio clip (a podcast, a TED talk, a news broadcast) and simultaneously repeat what you hear, mimicking not just the sounds but the rhythm, stress, and intonation. Start at 70% speed using a podcast app with speed control. Move to full speed over several weeks. This trains your ear and your mouth together.',
      },
      {
        heading: 'Word stress — the hidden key to clarity',
        body: 'English is a stress-timed language. Misplacing stress on a word often causes more confusion than mispronouncing individual sounds. For example: "record" (noun, stress on first syllable) vs "reCORD" (verb, stress on second). Use a dictionary to look up stress patterns for any word you are uncertain about. The IPA stress mark (ˈ) indicates which syllable carries primary stress.',
      },
      {
        heading: 'Daily pronunciation practice routine',
        body: 'A focused 10-minute daily session produces measurable improvement within 4–6 weeks:',
        bullets: [
          'Minutes 1–2: shadow a short audio clip at reduced speed',
          'Minutes 3–4: drill 5 minimal pairs that are difficult for you',
          'Minutes 5–7: read aloud from any text, focusing on one target sound per session',
          'Minutes 8–10: record yourself and listen back, noting specific sounds to target tomorrow',
        ],
      },
      {
        heading: 'Using Voxira to track pronunciation',
        body: 'After each speech analysis session, your clarity score reflects how consistently your words were recognised and articulated. A score above 85 indicates strong pronunciation. If your clarity score is in the 60–75 range, focus on the most common problem sound in your speech and dedicate one week of practice to it before moving to the next.',
      },
    ],
  },

  // ── Pace Control ────────────────────────────────────────────────────────────
  'Pace control': {
    id: 'pace-control',
    title: 'Pace Control',
    subtitle: 'Speak at the speed confidence demands',
    icon: 'speedometer-outline',
    color: '#0369A1',
    readTime: '4 min read',
    sections: [
      {
        heading: 'What is the ideal speaking pace?',
        body: 'Research on listener comprehension consistently places the ideal conversational speaking pace between 120 and 150 words per minute (WPM). Below 100 WPM, speech feels laboured and listeners disengage. Above 180 WPM, processing cannot keep up with delivery. Podcasters and TED speakers typically average 130–160 WPM. Auctioneers and speed-readers aside, professional communication lives in the 120–160 range.',
      },
      {
        heading: 'Why people speak too fast',
        body: 'Speed is almost always driven by one of three things: nervousness (adrenaline accelerates everything), over-preparation (the material feels so familiar you race through it), or a mistaken belief that pausing shows weakness. In reality, a speaker who pauses regularly appears more thoughtful, authoritative, and in control than one who rushes.',
      },
      {
        heading: 'Why people speak too slowly',
        body: 'Speaking below 100 WPM is less common but equally problematic. It usually stems from excessive caution about word choice, a deliberate attempt to sound formal, or lack of preparation causing hesitation. Listeners have limited patience — they will mentally "leave the room" if delivery is too slow.',
      },
      {
        heading: 'Techniques to slow down',
        body: 'If you tend to rush, these techniques directly address the root cause:',
        bullets: [
          'Breathe before you speak: taking one diaphragmatic breath before starting a sentence naturally slows pace',
          'Pause after key points: a 2-second pause after your main point lets it land before you move on — and feels far shorter to the listener than to you',
          'Mark pauses in your notes: literally write [PAUSE] at transition points in any prepared speech',
          'Record and measure: use Voxira or a metronome app to measure your WPM and compare to targets',
          'Read aloud at 80% speed: find a comfortable pace and practise feeling the slowness until it no longer feels unnatural',
        ],
      },
      {
        heading: 'Strategic variation — the advanced skill',
        body: 'Elite speakers do not speak at one constant pace. They use pace variation strategically: speeding up to convey excitement or urgency, slowing down to signal importance or gravity. A sentence delivered slowly and quietly after a faster passage draws the room in. Think of pace as a musical dynamic — loud/fast and soft/slow work in contrast to each other.',
        bullets: [
          'Speed up slightly when listing examples or building to a point',
          'Slow down to near-conversational pace for the most important sentence in a section',
          'Use a full stop + 2-second pause before a key statistic or conclusion',
          'Drop pace and volume simultaneously for maximum emphasis — the "whisper moment"',
        ],
      },
      {
        heading: 'Breathing and pace are the same system',
        body: 'Running out of breath is the primary cause of involuntary rushing. When breath is low, the brain instinctively tries to finish the sentence before air runs out. Train longer breath capacity by reading increasingly long sentences in one breath during practice. Also learn to take micro-breaths (half a second through the nose) at punctuation points in live speech.',
      },
      {
        heading: 'Measuring your pace with Voxira',
        body: 'Your WPM is displayed on every Voxira analysis result. The ideal range for most contexts is 120–150 WPM. If you consistently land above 160, focus on the pause technique for 2 weeks. If you consistently land below 110, focus on preparation and reducing hesitations — more familiarity with your material naturally increases confident pace.',
      },
    ],
  },

  // ── Confidence Tips ─────────────────────────────────────────────────────────
  'Confidence tips': {
    id: 'confidence-tips',
    title: 'Confidence Tips',
    subtitle: 'Build the mental and physical foundation for confident speaking',
    icon: 'trending-up-outline',
    color: '#92400E',
    readTime: '6 min read',
    sections: [
      {
        heading: 'Confidence is a skill, not a personality trait',
        body: 'The most important thing to understand about speaking confidence is that it is acquired through practice and preparation, not inherited. Research in communication anxiety consistently shows that the difference between "naturally confident" speakers and anxious ones is almost entirely explained by accumulated speaking experience. The implication is simple: more speaking equals more confidence — if done with reflection.',
      },
      {
        heading: 'The physiology of nerves',
        body: 'When you stand up to speak, your body releases adrenaline. Heart rate increases, hands may tremble, voice may tighten. This is identical to the physiological response to excitement. The psychological trick: reframe this response. Instead of "I am terrified", practise thinking "I am energised." Multiple studies show this cognitive reappraisal measurably reduces anxiety and improves performance. The physical sensation is the same — the label you give it changes everything.',
      },
      {
        heading: 'Posture as a confidence signal',
        body: 'Your body affects your mind as much as your mind affects your body. Adopting an open, upright posture before and during speaking genuinely changes internal physiological state. Shoulders back, feet hip-width apart, weight evenly distributed. Avoid crossed arms, hunched shoulders, or angled body positions — these close off both physical breath support and psychological readiness. Stand as if you have something important to say.',
        bullets: [
          'Stand with feet hip-width apart, weight balanced',
          'Keep shoulders relaxed and slightly back, chest open',
          'Make deliberate eye contact: 3–5 seconds per person before moving to the next',
          'Keep hands visible and still unless gesturing intentionally',
          'Avoid pacing or swaying — stillness signals certainty',
        ],
      },
      {
        heading: 'Preparation is confidence',
        body: 'The single most reliable source of speaking confidence is knowing your material so thoroughly that you could deliver it at 3am woken from deep sleep. Over-preparation removes the fear of "going blank." For any important speech or presentation, practise it aloud at least 5 times — not in your head, but out loud in full. The brain and mouth need to rehearse together, not just the brain alone.',
      },
      {
        heading: 'Mental preparation techniques',
        body: 'Beyond content preparation, these mental techniques are evidence-backed:',
        bullets: [
          'Visualisation: 5 minutes before speaking, close your eyes and run through a vivid mental movie of yourself speaking confidently and the audience responding positively',
          'Power posing: 2 minutes in an expansive pose (hands on hips, feet apart) has been shown to increase testosterone and reduce cortisol before a performance',
          'Box breathing: inhale 4 counts, hold 4 counts, exhale 4 counts, hold 4 counts — this directly activates the parasympathetic nervous system and reduces acute anxiety',
          'Focusing on your message, not yourself: anxiety is self-focused. Redirecting attention to "what does this audience need to understand?" shifts you into service mode and reduces performance anxiety',
        ],
      },
      {
        heading: 'Building confidence through regular practice',
        body: 'Confidence compounds. Each speaking experience — even a short one — deposits into a bank of evidence that you can do this. Strategies to accumulate speaking experience:',
        bullets: [
          'Use Voxira daily for even 2-minute sessions — each completed session builds track record',
          'Volunteer to speak first in meetings — the longer you wait, the more anxiety builds',
          'Join a structured speaking group like Toastmasters for safe, regular practice with feedback',
          'Have conversations with strangers — cashiers, baristas, colleagues you do not know — to normalise spontaneous verbal engagement',
          'Record yourself speaking and watch the recordings — most people are far better than they believe',
        ],
      },
      {
        heading: 'Handling nervousness in the moment',
        body: 'Even experienced speakers feel nerves. The goal is not to eliminate them but to prevent them from hijacking delivery.',
        bullets: [
          'Slow down deliberately at the first sign of rushing — nerves accelerate pace',
          'Take a visible breath before starting — audiences do not notice, but it physiologically resets your system',
          'If you lose your place: pause, breathe, look at your last note or recap your last point aloud — recovery is a skill',
          'Remember: the audience wants you to succeed. They are not adversaries.',
          'Accept imperfection: a slight stammer or brief pause is invisible to listeners but magnified in your own perception',
        ],
      },
    ],
  },
};

// Map trending search terms to topic keys (handles case variation)
export function findTopic(query: string): TopicContent | null {
  const key = Object.keys(TOPIC_CONTENT).find(
    k => k.toLowerCase() === query.toLowerCase().trim()
  );
  return key ? TOPIC_CONTENT[key] : null;
}
