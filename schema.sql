-- ============================================================
-- KLASS STUDIO — Clean Schema
-- Run this in Supabase SQL editor
-- Drops everything, rebuilds from scratch
-- ============================================================


-- ── 0. DROP EVERYTHING ───────────────────────────────────────────────────────

drop table if exists consumer_exports       cascade;
drop table if exists question_placements    cascade;
drop table if exists questions              cascade;
drop table if exists flashcards             cascade;
drop table if exists content_blocks         cascade;
drop table if exists topic_prerequisites    cascade;
drop table if exists topic_intros           cascade;
drop table if exists subtopics              cascade;
drop table if exists topics                 cascade;
drop table if exists subjects               cascade;
drop table if exists teachers               cascade;

-- legacy cs_ tables
drop table if exists cs_exports             cascade;
drop table if exists cs_draft_questions     cascade;
drop table if exists cs_questions           cascade;
drop table if exists cs_flashcards          cascade;
drop table if exists cs_content_blocks      cascade;
drop table if exists cs_topic_intros        cascade;
drop table if exists cs_subtopics           cascade;
drop table if exists cs_topics              cascade;
drop table if exists cs_structure           cascade;
drop table if exists cs_projects            cascade;

-- drop custom types if they exist
drop type if exists course_status           cascade;
drop type if exists question_status         cascade;
drop type if exists question_type           cascade;
drop type if exists block_type              cascade;
drop type if exists export_format           cascade;


-- ── 1. ENUMS ─────────────────────────────────────────────────────────────────

create type course_status   as enum ('draft', 'in_progress', 'complete', 'published');
create type question_status as enum ('draft', 'ready', 'exported');
create type question_type   as enum ('mcq', 'truefalse', 'fillingap', 'multiselect');
create type block_type      as enum (
  'definition', 'explanation', 'formula',
  'example', 'keypoint', 'note', 'diagram'
);
create type export_format   as enum ('jamsulator_json', 'generic_json', 'scorm');


-- ── 2. TEACHERS ──────────────────────────────────────────────────────────────
-- Lightweight — just auth identity + display name.
-- No ownership model. Used only for last_edited_by tracking.

create table teachers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  display_name text not null,
  created_at   timestamptz not null default now()
);


-- ── 3. SUBJECTS ──────────────────────────────────────────────────────────────
-- e.g. Mathematics, English Language, Physics

create table subjects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_edited_by uuid references teachers(id) on delete set null
);


-- ── 4. TOPICS ────────────────────────────────────────────────────────────────
-- Topic = Course. The full learning unit.
-- Subtopics cannot be created until topic_intro is marked complete (intro_complete = true).

create table topics (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  name            text not null,
  description     text,
  status          course_status not null default 'draft',
  intro_complete  boolean not null default false,  -- gates subtopic creation
  topic_order     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_edited_by  uuid references teachers(id) on delete set null
);


-- ── 5. TOPIC INTROS ───────────────────────────────────────────────────────────
-- The course foundation. Must be saved before subtopics unlock.
-- One row per topic (enforced by unique constraint).

create table topic_intros (
  id               uuid primary key default gen_random_uuid(),
  topic_id         uuid not null unique references topics(id) on delete cascade,
  overview         text not null default '',
  why_it_matters   text not null default '',
  prerequisites    text not null default '',   -- free text summary
  source_textbook  text not null default '',   -- pasted textbook excerpts
  source_transcript text not null default '',  -- pasted lecture/video transcript
  source_extra     text not null default '',   -- any other reference material
  is_complete      boolean not null default false,  -- teacher marks this done to unlock subtopics
  updated_at       timestamptz not null default now(),
  last_edited_by   uuid references teachers(id) on delete set null
);


-- ── 6. TOPIC PREREQUISITES ───────────────────────────────────────────────────
-- Cross-referencing: "Before studying Differentiation, learn Indices first."
-- Can reference topics across subjects.

create table topic_prerequisites (
  id                uuid primary key default gen_random_uuid(),
  topic_id          uuid not null references topics(id) on delete cascade,  -- the topic that requires prior knowledge
  requires_topic_id uuid not null references topics(id) on delete cascade,  -- the topic to learn first
  note              text,  -- optional: "Focus on the chain rule section"
  created_at        timestamptz not null default now(),
  unique(topic_id, requires_topic_id)
);


-- ── 7. SUBTOPICS ─────────────────────────────────────────────────────────────
-- "Expand on this" deep-dives within a topic/course.
-- Cannot exist unless topic_intros.is_complete = true (enforced in app + RLS).

create table subtopics (
  id              uuid primary key default gen_random_uuid(),
  topic_id        uuid not null references topics(id) on delete cascade,
  subject_id      uuid not null references subjects(id) on delete cascade,
  name            text not null,
  subtopic_order  int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_edited_by  uuid references teachers(id) on delete set null
);


-- ── 8. CONTENT BLOCKS ────────────────────────────────────────────────────────
-- The lesson body. Lives inside a subtopic.
-- Each block is a typed unit: definition, explanation, formula, etc.

create table content_blocks (
  id            uuid primary key default gen_random_uuid(),
  subtopic_id   uuid not null references subtopics(id) on delete cascade,
  type          block_type not null,
  title         text not null default '',
  body          text not null default '',
  analogy       text,
  breakdown     text,
  diagram_prompt text,
  steps         jsonb,   -- ExampleStep[]: [{ id, expression, talkingPoint }]
  question_id   uuid,    -- if type = 'question', inline reference
  flashcard_id  uuid,    -- if type = 'flashcard', inline reference
  block_order   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_edited_by uuid references teachers(id) on delete set null
);


-- ── 9. FLASHCARDS ────────────────────────────────────────────────────────────
-- Front/back revision cards. Belong to a subtopic.

create table flashcards (
  id           uuid primary key default gen_random_uuid(),
  subtopic_id  uuid not null references subtopics(id) on delete cascade,
  front        text not null default '',
  back         text not null default '',
  card_order   int not null default 0,
  created_at   timestamptz not null default now(),
  last_edited_by uuid references teachers(id) on delete set null
);


-- ── 10. QUESTIONS ─────────────────────────────────────────────────────────────
-- Two contexts: course-attached (subtopic_id set) or standalone mock exam (subtopic_id null).
-- is_mock_question = true means it was created for a mock/exam bank, not a specific course.

create table questions (
  id              uuid primary key default gen_random_uuid(),
  subtopic_id     uuid references subtopics(id) on delete cascade,  -- nullable for standalone
  subject_id      uuid references subjects(id) on delete set null,   -- always set, even for standalone
  type            question_type not null default 'mcq',
  question_text   text not null default '',
  options         jsonb not null default '[]',  -- [{ id, text }]
  correct_answer  text not null default '',
  hint            text not null default '',
  image_url       text,
  status          question_status not null default 'draft',
  is_mock_question boolean not null default false,
  question_order  int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_edited_by  uuid references teachers(id) on delete set null
);


-- ── 11. QUESTION PLACEMENTS ───────────────────────────────────────────────────
-- Places a question inline within the content block sequence.
-- A question appears after a specific content block in the flow.

create table question_placements (
  id             uuid primary key default gen_random_uuid(),
  subtopic_id    uuid not null references subtopics(id) on delete cascade,
  question_id    uuid not null references questions(id) on delete cascade,
  after_block_id uuid references content_blocks(id) on delete set null,  -- null = top of subtopic
  created_at     timestamptz not null default now(),
  unique(subtopic_id, question_id)
);


-- ── 12. CONSUMER EXPORTS ─────────────────────────────────────────────────────
-- Log of every export: who requested it, what format, which topic/subject.

create table consumer_exports (
  id             uuid primary key default gen_random_uuid(),
  subject_id     uuid references subjects(id) on delete set null,
  topic_id       uuid references topics(id) on delete set null,
  format         export_format not null default 'generic_json',
  consumer_name  text,           -- e.g. 'Jamsulator', 'Lagos Grammar School'
  exported_by    uuid references teachers(id) on delete set null,
  question_count int not null default 0,
  exported_at    timestamptz not null default now()
);


-- ── 13. INDEXES ──────────────────────────────────────────────────────────────

create index on topics            (subject_id);
create index on subtopics         (topic_id);
create index on subtopics         (subject_id);
create index on content_blocks    (subtopic_id);
create index on content_blocks    (block_order);
create index on flashcards        (subtopic_id);
create index on questions         (subtopic_id);
create index on questions         (subject_id);
create index on questions         (status);
create index on question_placements (subtopic_id);
create index on topic_prerequisites (topic_id);
create index on consumer_exports   (topic_id);


-- ── 14. UPDATED_AT TRIGGER ───────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_subjects_updated_at
  before update on subjects
  for each row execute function update_updated_at();

create trigger trg_topics_updated_at
  before update on topics
  for each row execute function update_updated_at();

create trigger trg_subtopics_updated_at
  before update on subtopics
  for each row execute function update_updated_at();

create trigger trg_content_blocks_updated_at
  before update on content_blocks
  for each row execute function update_updated_at();

create trigger trg_questions_updated_at
  before update on questions
  for each row execute function update_updated_at();


-- ── 15. RLS ───────────────────────────────────────────────────────────────────
-- Basic RLS: all authenticated users can read/write everything.
-- Extend per-teacher later when auth is wired up properly.

alter table teachers            enable row level security;
alter table subjects            enable row level security;
alter table topics              enable row level security;
alter table topic_intros        enable row level security;
alter table topic_prerequisites enable row level security;
alter table subtopics           enable row level security;
alter table content_blocks      enable row level security;
alter table flashcards          enable row level security;
alter table questions           enable row level security;
alter table question_placements enable row level security;
alter table consumer_exports    enable row level security;

-- Allow all operations for authenticated users (tighten later)
do $$
declare
  t text;
begin
  foreach t in array array[
    'teachers','subjects','topics','topic_intros','topic_prerequisites',
    'subtopics','content_blocks','flashcards','questions',
    'question_placements','consumer_exports'
  ]
  loop
    execute format(
      'create policy "authenticated_all" on %I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end;
$$;


-- ── 16. SEED — one test teacher + subject ─────────────────────────────────────

insert into teachers (id, email, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'admin@klass.studio', 'Admin');

insert into subjects (id, name, description) values
  ('00000000-0000-0000-0000-000000000010', 'Mathematics', 'Core mathematics curriculum'),
  ('00000000-0000-0000-0000-000000000011', 'English Language', 'Reading, writing and comprehension'),
  ('00000000-0000-0000-0000-000000000012', 'Biology', 'Life sciences');