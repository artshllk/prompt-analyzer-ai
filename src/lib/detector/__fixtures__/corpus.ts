/**
 * Seed ground-truth corpus for detector calibration + evaluation.
 *
 * This is the measurement backbone for Phases 1–3: every threshold and
 * weight in ../signals.ts is justified against this set, and eval.ts
 * turns it into a confusion matrix + false-positive rate.
 *
 * It is deliberately small but SPANS THE HARD CASES:
 *   - human writing that is plain/flat (looks "AI-ish" but isn't)
 *   - human writing by non-native English speakers (the #1 false-positive
 *     risk and an ethical landmine - see the /detector page copy)
 *   - AI text that has been paraphrased / "humanized" to strip tells
 *   - multiple content types: essay, email, technical, marketing, casual
 *
 * EXPAND THIS. A few hundred samples per class gives far more reliable
 * calibration than this seed. Add real samples over time; keep labels
 * honest. `source` is free-text provenance for your own auditing.
 */

export type Label = 'human' | 'ai'

export interface Sample {
  id: string
  label: Label
  kind: 'essay' | 'email' | 'technical' | 'marketing' | 'casual'
  source: string
  text: string
}

export const CORPUS: Sample[] = [
  // ---------------------------------------------------------------- HUMAN
  {
    id: 'h-essay-1',
    label: 'human',
    kind: 'essay',
    source: 'hand-written, native',
    text: `I never liked the ocean much as a kid. It was too big, too loud, and the water always tasted like a mistake. My brother loved it. He'd sprint straight in while I stood at the edge doing the math on how far out was too far. Years later I moved to a town on the coast almost by accident, and now I swim most mornings. Funny how that works. The thing you avoid becomes the thing you can't do without.`,
  },
  {
    id: 'h-email-1',
    label: 'human',
    kind: 'email',
    source: 'hand-written, native',
    text: `Hey Priya - quick one. I looked at the deck and I think slide 7 is doing too much. Can we cut the second chart? It repeats slide 5 basically. Also the client hates jargon so maybe swap "synergies" for something a human would say. No rush, tomorrow morning is fine. Thanks, and sorry for the late ping.`,
  },
  {
    id: 'h-nonnative-1',
    label: 'human',
    kind: 'essay',
    source: 'hand-written, non-native (ESL)',
    text: `In my country, the education is very different from here. When I was student, we must memorize many things and the teacher is always right, you cannot ask too much question. When I came here first time, I was surprise that students argue with professor and this is normal, even good. It take me long time to feel comfortable for speaking in the class. Now I think both system have good and bad point, but I prefer more freedom for asking.`,
  },
  {
    id: 'h-nonnative-2',
    label: 'human',
    kind: 'email',
    source: 'hand-written, non-native (ESL)',
    text: `Dear sir, I am writing for asking about the delivery of my order. It is already two week but I did not receive nothing. The tracking number is not working when I put it in the website. Please can you check for me and tell what is the problem. I need this item before the next month because it is a gift. Thank you very much for your help and understanding.`,
  },
  {
    id: 'h-technical-1',
    label: 'human',
    kind: 'technical',
    source: 'hand-written, native (dev)',
    text: `Okay so the bug was dumb. We were caching the user object but not the tier field, so upgrades didn't show up until the session expired. Fix is a one-liner: invalidate the cache key on the webhook instead of waiting for TTL. I added a test but honestly it's hard to test cache invalidation well without a real clock, so I faked the timer. Not proud of it. Works though.`,
  },
  {
    id: 'h-casual-1',
    label: 'human',
    kind: 'casual',
    source: 'hand-written, native',
    text: `lol no I did NOT finish the show. I fell asleep during episode 3 and my cat walked across the remote and somehow bought a movie?? so now I owe apple $19 for a film I will never watch. anyway don't spoil the ending, I'll get to it eventually, probably around the time the sun burns out.`,
  },
  {
    id: 'h-essay-2',
    label: 'human',
    kind: 'essay',
    source: 'hand-written, native',
    text: `My grandfather kept every receipt he ever got. Shoeboxes of them, decades deep, curling at the edges. We thought it was a quirk until he died and my mother found, tucked in among the grocery slips, the receipt from the flower shop where he bought my grandmother's first bouquet. He'd written the date on the back. That was the whole system, it turned out. The junk was camouflage for the things he couldn't say out loud.`,
  },
  {
    id: 'h-marketing-1',
    label: 'human',
    kind: 'marketing',
    source: 'hand-written, native (indie founder)',
    text: `We built this because our old tool made us want to throw the laptop out a window. That's it. That's the pitch. It does three things, it does them fast, and it doesn't try to also be your calendar and your therapist. If you want fifty features, we're not for you. If you want the boring thing that just works, come on in.`,
  },

  // ------------------------------------------------------------------- AI
  {
    id: 'a-essay-1',
    label: 'ai',
    kind: 'essay',
    source: 'GPT-style, untouched',
    text: `The ocean has long captivated the human imagination, serving as a powerful symbol of both beauty and mystery. It is important to note that our relationship with the sea is multifaceted, encompassing recreation, commerce, and profound emotional resonance. Moreover, the ocean plays a crucial role in regulating the planet's climate. As we delve into this topic, it becomes clear that understanding the ocean is not just about science — it is about appreciating a vital part of our shared world.`,
  },
  {
    id: 'a-marketing-1',
    label: 'ai',
    kind: 'marketing',
    source: 'GPT-style, untouched',
    text: `In today's fast-paced digital age, businesses must leverage cutting-edge solutions to stay ahead. Our platform seamlessly streamlines your workflow, unlocking the potential of your team and fostering a culture of innovation. Whether you're a small startup or a large enterprise, our robust, state-of-the-art tools empower you to navigate the complexities of the modern market. It's not just about efficiency — it's about transforming the way you work.`,
  },
  {
    id: 'a-technical-1',
    label: 'ai',
    kind: 'technical',
    source: 'GPT-style, untouched',
    text: `Caching is a fundamental concept that plays a significant role in modern software architecture. It is essential to understand that effective caching strategies can dramatically improve performance. Additionally, cache invalidation remains one of the most challenging aspects of the process. Furthermore, developers must carefully consider the trade-offs involved. In conclusion, a comprehensive understanding of caching is crucial for building robust, scalable, and high-performing applications.`,
  },
  {
    id: 'a-email-1',
    label: 'ai',
    kind: 'email',
    source: 'GPT-style, untouched',
    text: `Dear Team, I hope this message finds you well. I am reaching out to provide a comprehensive update on our ongoing project. It is important to note that we have made significant progress across several key areas. Moreover, our collaborative efforts have fostered a productive environment. As we move forward, it is crucial that we continue to leverage our collective strengths. Please do not hesitate to reach out with any questions. Best regards.`,
  },
  {
    id: 'a-essay-2',
    label: 'ai',
    kind: 'essay',
    source: 'GPT-style, untouched',
    text: `Education is a cornerstone of human development, serving as a powerful catalyst for personal and societal growth. In the ever-evolving landscape of the modern world, it is essential to recognize the transformative power of learning. Furthermore, education fosters critical thinking and empowers individuals to navigate an increasingly complex world. It is worth noting that access to quality education remains a pivotal factor in reducing inequality and unlocking human potential.`,
  },
  {
    id: 'a-humanized-1',
    label: 'ai',
    kind: 'casual',
    source: 'GPT then paraphrased to "humanize"',
    text: `Honestly, the ocean is such a big deal for the planet and people don't really think about it enough. It handles a huge chunk of the climate stuff, gives tons of people jobs, and there's something about it that just hits you emotionally, you know? It's not only about the science side of things. It's more about realizing how much of our world is tied up in this one massive resource that we kind of take for granted.`,
  },
  {
    id: 'a-humanized-2',
    label: 'ai',
    kind: 'technical',
    source: 'GPT then paraphrased to "humanize"',
    text: `So caching is basically one of those things that quietly makes everything faster behind the scenes. The tricky part is knowing when to throw away the old cached data, because getting that wrong causes really annoying bugs. There's always a trade-off between speed and freshness, and you kind of have to pick your poison depending on the app. Overall it's a super important tool, you just have to respect how easy it is to mess up.`,
  },
  {
    id: 'a-marketing-2',
    label: 'ai',
    kind: 'marketing',
    source: 'GPT-style, untouched',
    text: `Unlock the power of productivity with our innovative platform. Designed to seamlessly integrate into your daily workflow, our solution empowers teams to achieve more with less effort. At the heart of our mission is a commitment to excellence and a relentless focus on the user experience. Whether you're managing a small project or a large-scale operation, our robust tools stand as a testament to what modern software can achieve.`,
  },
]
