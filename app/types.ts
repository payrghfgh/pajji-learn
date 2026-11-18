export type Flashcard = {
  q: string;
  a: string;
};

export type QuizQuestion = {
  type: string;
  question: string;
  options: string[];
  correct: string;
};

export type ChapterMedia = {
  video?: string;
  slides?: string;
  bookPdf?: string;
  audioBook?: string;
  infographic?: string;
  mindMap?: string;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  spellings: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  media: ChapterMedia;
};

export type Book = {
  id: string;
  title: string;
  chapters: Chapter[];
};
