/*
  # Seed missing topics for all modules across grades 4-6

  14 modules had no topics, causing the module selection wizard to show
  a blank topic selection screen. This adds 2 topics per module (28 total).
*/

-- ============================================================================
-- Grade 4 Topics (12 topics)
-- Convention: {module_id}-topic-{n}
-- ============================================================================
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  -- Grammar Basics (eng-2)
  ('eng-2-topic-1', 'Nouns and Pronouns', 'Identify and use common nouns, proper nouns, and personal pronouns in sentences.', 'eng-2', 'Content about nouns and pronouns...', 1),
  ('eng-2-topic-2', 'Verbs and Tenses', 'Use action verbs correctly and form simple present and past tenses.', 'eng-2', 'Content about verbs and tenses...', 2),
  -- Writing Skills (eng-3)
  ('eng-3-topic-1', 'Narrative Writing', 'Write short stories set in Ghanaian communities with clear beginning, middle, and end.', 'eng-3', 'Content about narrative writing...', 1),
  ('eng-3-topic-2', 'Letter Writing', 'Write informal letters to friends and formal letters following correct format.', 'eng-3', 'Content about letter writing...', 2),
  -- Vocabulary Building (eng-4)
  ('eng-4-topic-1', 'Context Clues', 'Use surrounding words and sentences to determine the meaning of unfamiliar words.', 'eng-4', 'Content about context clues...', 1),
  ('eng-4-topic-2', 'Synonyms and Antonyms', 'Identify and use words with similar and opposite meanings to expand vocabulary.', 'eng-4', 'Content about synonyms and antonyms...', 2),
  -- Basic Algebra (math-2)
  ('math-2-topic-1', 'Number Patterns', 'Identify, describe, and extend number patterns and sequences.', 'math-2', 'Content about number patterns...', 1),
  ('math-2-topic-2', 'Simple Equations', 'Solve simple equations with one unknown using number boxes and balancing.', 'math-2', 'Content about simple equations...', 2),
  -- Geometry and Measurement (math-3)
  ('math-3-topic-1', '2D Shapes and Properties', 'Identify and describe properties of rectangles, triangles, circles, and other 2D shapes.', 'math-3', 'Content about 2D shapes...', 1),
  ('math-3-topic-2', 'Length and Mass', 'Measure and estimate length in centimetres and metres, and mass in grams and kilograms.', 'math-3', 'Content about length and mass...', 2),
  -- Data Handling (math-4)
  ('math-4-topic-1', 'Pictographs and Bar Charts', 'Read, interpret, and create pictographs and bar charts using classroom and school data.', 'math-4', 'Content about pictographs and bar charts...', 1),
  ('math-4-topic-2', 'Tally Charts and Tables', 'Collect data using tally marks and organize information in frequency tables.', 'math-4', 'Content about tally charts and tables...', 2);

-- ============================================================================
-- Grade 5 Topics (8 topics)
-- Convention: {module_id}-t{n}
-- ============================================================================
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  -- Essay Writing (eng-5-3)
  ('eng-5-3-t1', 'Narrative Essays', 'Write structured narrative essays with a clear introduction, body, and conclusion.', 'eng-5-3', 'Content about narrative essays...', 1),
  ('eng-5-3-t2', 'Descriptive Essays', 'Use sensory details and vivid language to describe Ghanaian places, people, and events.', 'eng-5-3', 'Content about descriptive essays...', 2),
  -- Advanced Vocabulary (eng-5-4)
  ('eng-5-4-t1', 'Prefixes and Suffixes', 'Understand how adding prefixes and suffixes changes the meaning of words.', 'eng-5-4', 'Content about prefixes and suffixes...', 1),
  ('eng-5-4-t2', 'Root Words', 'Identify root words to unlock the meanings of unfamiliar vocabulary.', 'eng-5-4', 'Content about root words...', 2),
  -- Perimeter, Area, and Volume (math-5-3)
  ('math-5-3-t1', 'Perimeter and Area', 'Calculate the perimeter and area of rectangles and compound shapes.', 'math-5-3', 'Content about perimeter and area...', 1),
  ('math-5-3-t2', 'Volume of Cuboids', 'Calculate the volume of cuboids using length, width, and height measurements.', 'math-5-3', 'Content about volume of cuboids...', 2),
  -- Data Analysis (math-5-4)
  ('math-5-4-t1', 'Bar and Line Graphs', 'Create and interpret bar graphs and line graphs using Ghanaian population and weather data.', 'math-5-4', 'Content about bar and line graphs...', 1),
  ('math-5-4-t2', 'Pie Charts', 'Read and interpret pie charts showing market prices, population, and survey data.', 'math-5-4', 'Content about pie charts...', 2);

-- ============================================================================
-- Grade 6 Topics (8 topics)
-- Convention: {module_id}-t{n}
-- ============================================================================
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  -- Research and Report Writing (eng-6-3)
  ('eng-6-3-t1', 'Research Skills', 'Use books, articles, and resources to gather and organize information on a topic.', 'eng-6-3', 'Content about research skills...', 1),
  ('eng-6-3-t2', 'Report Writing', 'Write structured reports with headings, subheadings, and summaries of findings.', 'eng-6-3', 'Content about report writing...', 2),
  -- Literature Appreciation (eng-6-4)
  ('eng-6-4-t1', 'Ghanaian Poetry', 'Analyze rhythm, imagery, and themes in poems by Ghanaian and African poets.', 'eng-6-4', 'Content about Ghanaian poetry...', 1),
  ('eng-6-4-t2', 'Prose and Drama', 'Study characters, plot, and setting in Ghanaian short stories and plays.', 'eng-6-4', 'Content about prose and drama...', 2),
  -- Geometry and Transformations (math-6-3)
  ('math-6-3-t1', 'Symmetry and Reflection', 'Identify lines of symmetry and draw reflections of 2D shapes.', 'math-6-3', 'Content about symmetry and reflection...', 1),
  ('math-6-3-t2', 'Rotation and Translation', 'Rotate and translate shapes on a coordinate grid.', 'math-6-3', 'Content about rotation and translation...', 2),
  -- Probability and Statistics (math-6-4)
  ('math-6-4-t1', 'Basic Probability', 'Calculate the probability of simple events using coins, dice, and spinners.', 'math-6-4', 'Content about basic probability...', 1),
  ('math-6-4-t2', 'Mean, Median, and Mode', 'Find measures of central tendency from data sets collected in Ghanaian contexts.', 'math-6-4', 'Content about mean, median, and mode...', 2);
