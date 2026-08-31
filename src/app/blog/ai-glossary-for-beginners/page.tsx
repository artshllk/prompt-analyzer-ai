import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'AI Glossary for Beginners: 30 Terms Explained Simply',
  description: 'A plain-English AI glossary. Clear, jargon-free definitions of the AI terms you keep seeing, from tokens and prompts to hallucinations and large language models.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-glossary-for-beginners' },
  openGraph: {
    title: 'AI Glossary for Beginners: 30 Terms Explained Simply',
    description: 'A plain-English AI glossary. Clear, jargon-free definitions of the AI terms you keep seeing.',
    url: 'https://deepclario.com/blog/ai-glossary-for-beginners',
    type: 'article',
  },
}

const post = getBlogPost('ai-glossary-for-beginners')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Glossary for Beginners: 30 Terms Explained Simply',
  description: 'A beginner-friendly glossary of common AI terms, each defined in plain English without jargon.',
  author: { '@type': 'Person', name: 'Art Shllaku', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'what does ai mean in simple words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI, or artificial intelligence, is software that learns patterns from examples and makes its own guesses, instead of following fixed rules a person wrote. Chatbots, spam filters, and photo recognition are all AI.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is a token in ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A token is a small chunk of text an AI model reads, usually a short word or part of a word. Models break your text into tokens before processing it, and price and length limits are measured in tokens, not words.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is a prompt in ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt is the message or instruction you give an AI. It is what you type into a chatbot. A clear, specific prompt leads to a better answer, because the model builds its reply from the words you give it.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is a large language model?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A large language model, or LLM, is an AI built for text. It learned patterns from huge amounts of writing and uses them to predict and produce words. ChatGPT, Claude, and Gemini are large language models.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
    { '@type': 'ListItem', position: 3, name: 'AI Glossary for Beginners', item: 'https://deepclario.com/blog/ai-glossary-for-beginners' },
  ],
}

// Terms grouped so the page is easy to scan. `link` points to a deeper post when we have one.
const groups: { heading: string; terms: { term: string; def: string; link?: string }[] }[] = [
  {
    heading: 'The big picture',
    terms: [
      { term: 'Artificial intelligence (AI)', def: 'Software that learns patterns from examples and makes its own guesses, instead of following fixed rules a person wrote. The broad umbrella term.', link: '/blog/what-is-artificial-intelligence' },
      { term: 'Machine learning', def: 'The main method behind modern AI: software that learns from examples instead of being given rules. It sits inside AI.', link: '/blog/machine-learning-explained' },
      { term: 'Deep learning', def: 'A powerful kind of machine learning, loosely inspired by how brain cells connect. It made recent leaps in language and images possible.' },
      { term: 'Generative AI', def: 'Any AI that creates new things, like text, images, or music, rather than just sorting or labeling. Chatbots are generative AI.' },
      { term: 'Large language model (LLM)', def: 'An AI built for text. It learned from huge amounts of writing and predicts words. ChatGPT, Claude, and Gemini are LLMs.' },
    ],
  },
  {
    heading: 'How it works',
    terms: [
      { term: 'Token', def: 'A small chunk of text a model reads, usually a short word or part of a word. Length and price are measured in tokens.', link: '/blog/what-is-a-token-in-ai' },
      { term: 'Prompt', def: 'The message or instruction you give an AI. A clearer prompt gets a better answer.', link: '/blog/what-is-a-good-prompt' },
      { term: 'Next-word prediction', def: 'The core trick behind chatbots: they build an answer by guessing the next word, one at a time.', link: '/blog/how-ai-predicts-words' },
      { term: 'Training', def: 'The process where a model learns, by guessing, checking against real answers, and adjusting, across huge amounts of data.', link: '/blog/machine-learning-explained' },
      { term: 'Training data', def: 'The examples a model learns from. A model is only as good, and as fair, as the data it was trained on.' },
      { term: 'Parameters', def: 'The internal settings a model adjusts during training. More parameters roughly means more capacity to learn, though bigger is not always better.' },
      { term: 'Inference', def: 'The moment a trained model is actually used to produce an answer. Training is learning; inference is doing.' },
      { term: 'Embedding', def: 'A way of turning words into numbers that capture meaning, so the AI can measure how related two things are.', link: '/blog/embeddings-explained' },
      { term: 'Context window', def: 'How much text a model can look at once, measured in tokens. Go over it and the oldest text drops out of view.' },
      { term: 'Neural network', def: 'The layered structure at the heart of deep learning, loosely modeled on connected brain cells.' },
    ],
  },
  {
    heading: 'Prompting terms',
    terms: [
      { term: 'Prompt engineering', def: 'The skill of writing clear instructions that get better, more reliable answers from AI.', link: '/blog/what-is-prompt-engineering' },
      { term: 'System prompt', def: 'A behind-the-scenes instruction that sets how the AI should behave for a whole conversation.', link: '/blog/chatgpt-system-prompt-examples' },
      { term: 'Zero-shot', def: 'Asking the AI to do a task with no examples, just the instruction.', link: '/blog/zero-shot-vs-few-shot-prompting' },
      { term: 'Few-shot', def: 'Giving the AI a few examples of what you want before your real request, which improves consistency.', link: '/blog/zero-shot-vs-few-shot-prompting' },
      { term: 'Chain-of-thought', def: 'Asking the model to reason step by step before answering, which improves accuracy on harder problems.', link: '/blog/chain-of-thought-prompting' },
      { term: 'Role prompting', def: 'Telling the AI who to act as, like "act as an editor," to shape its tone and focus.', link: '/blog/role-prompting-examples' },
      { term: 'Context', def: 'The background you give a prompt, like the audience and goal, so the model does not have to guess.', link: '/blog/how-context-improves-ai-responses' },
    ],
  },
  {
    heading: 'Quality and safety',
    terms: [
      { term: 'Hallucination', def: 'When an AI confidently states something false or made up. It happens because the model writes what sounds right, not what it checked.', link: '/blog/why-ai-makes-mistakes' },
      { term: 'AI detector', def: 'A tool that guesses whether text was written by AI, by measuring how smooth and predictable it is.', link: '/blog/how-ai-detectors-work' },
      { term: 'False positive', def: 'When an AI detector wrongly flags human writing as AI. Plain, even writing gets flagged most.', link: '/blog/ai-detector-false-positives' },
      { term: 'Bias', def: 'When a model reflects unfair patterns from its training data, treating some groups or ideas differently.' },
      { term: 'Fine-tuning', def: 'Extra training that adapts a general model to a specific job or style, using a focused set of examples.' },
      { term: 'RAG (retrieval-augmented generation)', def: 'Giving a model real documents to pull from before it answers, which reduces made-up facts.' },
      { term: 'Temperature', def: 'A setting that controls how random a model’s word choices are. Lower is more predictable; higher is more varied.' },
      { term: 'Multimodal', def: 'An AI that handles more than just text, such as images, audio, or video, alongside words.' },
    ],
  },
]

export default function AIGlossaryPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="editorial grain min-h-screen">
        <MarketingNav current="blog" />

        <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-36 pb-16">
          <div className="mb-6">
            <Link href="/" className="text-xs text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper-mute)] transition-colors">← Back to Deepclario</Link>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">AI Basics</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 9 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            AI Glossary for Beginners
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            AI comes with a lot of jargon, and most of it sounds harder than it is. This is a
            plain-English glossary of the terms you keep running into. Each one is a short, clear
            definition you can actually understand. Where a term deserves a fuller explanation, there
            is a link to a deeper guide.
          </p>

          <article className="max-w-none space-y-10">
            {groups.map(group => (
              <section key={group.heading}>
                <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">{group.heading}</h2>
                <div className="space-y-3">
                  {group.terms.map(t => (
                    <div key={t.term} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                      <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{t.term}</p>
                      <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">
                        {t.def}
                        {t.link && (
                          <>
                            {' '}
                            <Link href={t.link} className="text-[color:var(--color-paper)] underline underline-offset-2 hover:opacity-70 transition-opacity">
                              Read more
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to keep learning</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                You do not need to memorize any of this. The terms make far more sense once you see how
                the pieces fit together. If you want the fuller picture, start with what artificial
                intelligence is, then read how AI predicts words, and the rest of the glossary will
                click into place.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Put the words into practice</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write clearer prompts and check whether text looks AI-written. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the prompt improver →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-artificial-intelligence" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is artificial intelligence? →
              </Link>
              <Link href="/blog/how-ai-predicts-words" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI predicts words →
              </Link>
              <Link href="/blog/what-is-prompt-engineering" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is prompt engineering? →
              </Link>
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
            </div>
          </div>
          <PostFooter slug="ai-glossary-for-beginners" />
        </main>
      </div>
    </>
  )
}
