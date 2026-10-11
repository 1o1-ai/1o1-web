/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved.
   Learn AI — beginner vocabulary for the Yogabrata classroom. */
(function () {
  const ym_orbits = [
    { id: "first", name: "First words", tint: "#67e8f9", spin: "96s", rx: 178, ry: 132 },
    { id: "learn", name: "How it learns", tint: "#fbbf24", spin: "138s", rx: 292, ry: 208 },
    { id: "today", name: "Networks & language", tint: "#c4b5fd", spin: "176s", rx: 404, ry: 280 }
  ];

  const ym_words = [
    {
      id: "artificial-intelligence",
      term: "Artificial intelligence",
      short: "AI",
      emblem: "✦",
      ring: 0,
      sentence: "Software that carries out a task which usually asks for human judgment — recognizing a face, translating a sentence, or choosing a next move.",
      analogy: "A kitchen that follows a recipe and also notices when the sauce needs a pinch less salt. That noticing is the part people call intelligent.",
      meet: "A map that offers a new route when the road ahead slows down.",
      say: "The program is handling a task that used to need a person watching.",
      nearby: ["machine-learning", "algorithm", "model"],
      check: {
        prompt: "Which everyday moment is artificial intelligence at work?",
        choices: [
          "A paper map that never changes",
          "A navigation app that reroutes when traffic builds",
          "A light switch that stays off until you press it"
        ],
        answer: 1,
        why: "The app is judging a changing situation and choosing a useful next step. A fixed map and a plain switch follow one unchanging action."
      }
    },
    {
      id: "machine-learning",
      term: "Machine learning",
      short: "ML",
      emblem: "◈",
      ring: 0,
      sentence: "A kind of artificial intelligence that gets better at a task by studying examples, so a person does not have to write a fresh rule for every case.",
      analogy: "Hands that learn ripe mangoes by holding many of them. After a while the feel is familiar, even on a mango you have never held.",
      meet: "An inbox that starts catching the spam you mark, and gets surer as the examples grow.",
      say: "It learned this from examples.",
      nearby: ["artificial-intelligence", "data", "training", "model"],
      check: {
        prompt: "What does a machine-learning program mainly study?",
        choices: [
          "Examples, so it can notice patterns",
          "One handwritten rule meant to cover every future case",
          "A printed list of every answer it will ever need"
        ],
        answer: 0,
        why: "Machine learning finds patterns in examples. A single handwritten rule for every case is an older style of software."
      }
    },
    {
      id: "data",
      term: "Data",
      short: "Data",
      emblem: "▦",
      ring: 0,
      sentence: "The examples a learning program studies: numbers, words, pictures, sounds, or rows in a table.",
      analogy: "The practice sheets a student works through before the exam. The sheets are the data. The skill that remains is the model.",
      meet: "A folder of photos, each one marked cat or dog, ready for a picture model to study.",
      say: "These are the examples.",
      nearby: ["feature", "label", "training", "machine-learning"],
      check: {
        prompt: "In machine learning, data is…",
        choices: [
          "The finished skill after practice",
          "The examples the program studies",
          "The button a person clicks to start the computer"
        ],
        answer: 1,
        why: "Data is the collection of examples. The skill that remains after studying them is the model."
      }
    },
    {
      id: "algorithm",
      term: "Algorithm",
      short: "Algo",
      emblem: "∷",
      ring: 0,
      sentence: "A clear sequence of steps a computer follows to solve one kind of problem.",
      analogy: "A recipe: the ingredients, the order, and what “done” looks like. Follow it the same way and you get the same kind of result.",
      meet: "Sorting a contact list from A to Z. A learning algorithm is the recipe that improves a model from data.",
      say: "These are the steps.",
      nearby: ["model", "training", "machine-learning"],
      check: {
        prompt: "An algorithm is best described as…",
        choices: [
          "A sequence of steps for a kind of problem",
          "A pile of unlabeled photos",
          "The final guess a model makes"
        ],
        answer: 0,
        why: "An algorithm is the procedure. The photos would be data, and the final guess would be a prediction."
      }
    },
    {
      id: "model",
      term: "Model",
      short: "Model",
      emblem: "◉",
      ring: 0,
      sentence: "The compact memory of patterns left after learning, ready to be used on a new example.",
      analogy: "The skill in a musician’s hands after practice. The sheet music was the data. The skill that stays is the model.",
      meet: "After studying many house sales, a model can suggest a price for a house it has never seen.",
      say: "This is what the program learned.",
      nearby: ["training", "prediction", "machine-learning", "neural-network"],
      check: {
        prompt: "After training, what do we call the learned patterns we keep?",
        choices: [
          "The model",
          "The label",
          "The prompt"
        ],
        answer: 0,
        why: "The model is the kept result of training. A label is the answer on an example. A prompt is what you later type to a language model."
      }
    },
    {
      id: "feature",
      term: "Feature",
      short: "Feature",
      emblem: "✧",
      ring: 0,
      sentence: "One detail the model is allowed to look at, such as price, color, age, or how many words are in a sentence.",
      analogy: "On a fruit stall, color, weight, and fragrance are features. A nickname painted on the crate is not something the scale can use.",
      meet: "For house prices, floor area, number of rooms, and neighborhood can each be a feature.",
      say: "This is a detail the model uses.",
      nearby: ["label", "data", "classification"],
      check: {
        prompt: "Which item is a feature for a house-price model?",
        choices: [
          "The number of rooms",
          "The wish that the house “feels lucky”",
          "The word Model itself"
        ],
        answer: 0,
        why: "A feature is a detail the model can measure. Number of rooms is such a detail."
      }
    },
    {
      id: "label",
      term: "Label",
      short: "Label",
      emblem: "⚑",
      ring: 0,
      sentence: "The correct answer attached to an example, so the model can learn what “right” looks like.",
      analogy: "The answer written on the back of a flash card. The front is the question. The back is the label.",
      meet: "A photo whose file says “cat”. The pixels are the features. Cat is the label.",
      say: "This is the right answer on the example.",
      nearby: ["feature", "supervised-learning", "training"],
      check: {
        prompt: "A photo marked “cat” — what is the label?",
        choices: [
          "The word cat",
          "The brightness of one pixel",
          "The camera that took the photo"
        ],
        answer: 0,
        why: "The label is the answer attached to the example. Brightness might be a feature. The camera is just how the photo was made."
      }
    },
    {
      id: "prediction",
      term: "Prediction",
      short: "Predict",
      emblem: "➤",
      ring: 0,
      sentence: "The model’s best guess for a new example, drawn from patterns it has already learned.",
      analogy: "Looking at the evening sky and saying “rain is coming”, from clouds you have learned to read.",
      meet: "“This message looks like spam” is a prediction. It can be checked against the true label.",
      say: "This is the model’s guess.",
      nearby: ["model", "classification", "testing", "accuracy"],
      check: {
        prompt: "A prediction is…",
        choices: [
          "The model’s guess on an example",
          "The folder where training photos are stored",
          "The steps of an algorithm written on paper"
        ],
        answer: 0,
        why: "A prediction is the guess the model produces. Storage is data’s home, and written steps are the algorithm."
      }
    },
    {
      id: "supervised-learning",
      term: "Supervised learning",
      short: "Superv.",
      emblem: "✓",
      ring: 1,
      sentence: "Learning from examples that already carry the correct answer.",
      analogy: "A tutor who shows worked solutions, then asks you to try a fresh problem of the same kind.",
      meet: "Teaching a model handwritten digits by showing many digits with the right number beside each one.",
      say: "It learned from examples that already had answers.",
      nearby: ["label", "unsupervised-learning", "training", "classification"],
      check: {
        prompt: "Supervised learning studies examples that…",
        choices: [
          "Arrive with the correct answer attached",
          "Have no answers, only a reward at the end",
          "Are hidden until the model invents its own labels"
        ],
        answer: 0,
        why: "Supervised learning uses labeled examples. A reward after each try is the shape of reinforcement learning."
      }
    },
    {
      id: "unsupervised-learning",
      term: "Unsupervised learning",
      short: "Unsuper.",
      emblem: "❖",
      ring: 1,
      sentence: "Learning from examples that have no answers attached, by finding groups and patterns on its own.",
      analogy: "Sorting a mixed drawer of buttons by color and size before anyone has named the piles.",
      meet: "A shop grouping customers by what they tend to buy, before anyone has named those groups.",
      say: "It found groups without being handed the answers.",
      nearby: ["supervised-learning", "data", "feature"],
      check: {
        prompt: "Unsupervised learning is useful when…",
        choices: [
          "You want groups in the examples, and no answers are attached yet",
          "Every example already has the correct category written on it",
          "The only signal is a point score after each move in a game"
        ],
        answer: 0,
        why: "Unsupervised learning looks for structure when labels are absent. Labeled categories are supervised learning. Point scores after moves are reinforcement learning."
      }
    },
    {
      id: "reinforcement-learning",
      term: "Reinforcement learning",
      short: "Reward",
      emblem: "★",
      ring: 1,
      sentence: "Learning by trying actions, then receiving a reward or a penalty, and preferring the actions that raised the score.",
      analogy: "Learning to ride a bicycle. Staying up feels successful. A wobble is a clear signal to try a different balance next time.",
      meet: "A game-playing program that gains points for useful moves and loses points for poor ones.",
      say: "It learned by trying, and it kept what scored well.",
      nearby: ["training", "supervised-learning", "model"],
      check: {
        prompt: "Reinforcement learning improves by…",
        choices: [
          "Trying actions and keeping the ones that score well",
          "Reading a label that was written on every example in advance",
          "Sorting unlabeled photos into piles by color alone"
        ],
        answer: 0,
        why: "The learning signal is the reward or penalty after an action. Labels written in advance are supervised learning."
      }
    },
    {
      id: "training",
      term: "Training",
      short: "Train",
      emblem: "↻",
      ring: 1,
      sentence: "The practice period when the model studies examples and adjusts itself toward the patterns in them.",
      analogy: "Team practice before match day. The drills are the data. The coach’s method is the learning algorithm. The skill afterward is the model.",
      meet: "Showing a spam model a huge set of old messages, each marked spam or welcome, and letting it adjust.",
      say: "This is practice time for the model.",
      nearby: ["testing", "data", "model", "overfitting"],
      check: {
        prompt: "Training is the period when the model…",
        choices: [
          "Studies examples and adjusts",
          "Is locked and only graded on unseen examples",
          "Waits for a person to type a prompt"
        ],
        answer: 0,
        why: "Training is practice and adjustment. Grading on examples held back is testing. Typing a prompt comes later, when you use a language model."
      }
    },
    {
      id: "testing",
      term: "Testing",
      short: "Test",
      emblem: "◇",
      ring: 1,
      sentence: "Checking the model on examples it did not study, to see whether the skill travels to new situations.",
      analogy: "A closed-book exam. New questions show whether the student learned the idea or only memorized last night’s worksheet.",
      meet: "Holding back some house-sale records, then asking the trained model to price those homes.",
      say: "This is the exam on new examples.",
      nearby: ["training", "accuracy", "overfitting"],
      check: {
        prompt: "A fair test uses examples that…",
        choices: [
          "The model did not study during training",
          "Were repeated until the model scored perfectly on them",
          "Have had their answers erased so scoring is impossible"
        ],
        answer: 0,
        why: "Testing asks whether the skill works on new examples. Repeating the practice set until the score is perfect hides memorization."
      }
    },
    {
      id: "accuracy",
      term: "Accuracy",
      short: "Score",
      emblem: "%",
      ring: 1,
      sentence: "The share of examples, usually on a test, where the model’s guess matched the label.",
      analogy: "Eighteen correct flash cards out of twenty is 90% accuracy on that stack.",
      meet: "If a model labels 90 of 100 new emails in agreement with their labels, its accuracy on that set is 90%.",
      say: "This is how often the guess matched.",
      nearby: ["testing", "prediction", "overfitting"],
      check: {
        prompt: "A model agrees with the label on 45 of 50 test examples. Its accuracy on that set is…",
        choices: [
          "45%",
          "90%",
          "50"
        ],
        answer: 1,
        why: "Accuracy is the share that matched: 45 out of 50 is 90%. The number 50 is the size of the set, not the score."
      }
    },
    {
      id: "overfitting",
      term: "Overfitting",
      short: "Overfit",
      emblem: "◎",
      ring: 1,
      sentence: "A model that has memorized the practice examples, quirks included, and then stumbles when the examples are new.",
      analogy: "A student who can recite last year’s paper and freezes when the questions are reworded.",
      meet: "A spam model with a perfect score on the training messages and a weak score on new messages.",
      say: "It memorized practice and missed the lasting pattern.",
      nearby: ["training", "testing", "accuracy"],
      check: {
        prompt: "Which pattern is overfitting?",
        choices: [
          "Strong on practice examples, weak on new ones",
          "Steady and similar on practice examples and on new ones",
          "A prompt that asks for a shorter answer"
        ],
        answer: 0,
        why: "Overfitting shows up as a gap: practice looks solved, and new examples do not. A steady score on both is the sign of a pattern that traveled."
      }
    },
    {
      id: "bias",
      term: "Bias",
      short: "Bias",
      emblem: "◔",
      ring: 1,
      sentence: "A tilt in the model’s guesses. It often echoes a tilt that was already in the examples it studied. In some formulas the same word also names a number added before a decision. Here it means the tilt.",
      analogy: "A fruit judge who has tasted mangoes from only one orchard, and then scores every other orchard as if it should taste the same.",
      meet: "A hiring model trained mostly on one kind of past hire will tend to prefer that kind of candidate again.",
      say: "The examples leaned, so the guesses lean.",
      nearby: ["data", "training", "testing", "accuracy"],
      check: {
        prompt: "In everyday AI talk, bias means…",
        choices: [
          "A tilt in the examples or in the guesses",
          "The gold ring around a planet in this classroom",
          "A perfect score on every possible example"
        ],
        answer: 0,
        why: "Bias is the tilt. A perfect score on every possible example is a wish, not a definition, and real tests exist to reveal tilt."
      }
    },
    {
      id: "classification",
      term: "Classification",
      short: "Class",
      emblem: "▣",
      ring: 1,
      sentence: "A prediction that places an example into a category, such as spam or welcome, ripe or early, cat or dog.",
      analogy: "Sorting letters into two trays as they arrive. Each letter goes to one tray. The tray is the class.",
      meet: "“This message is spam” is a classification. Guessing a house price, a number on a scale, is a different kind of prediction.",
      say: "This guess picks a category.",
      nearby: ["prediction", "label", "supervised-learning"],
      check: {
        prompt: "Which guess is a classification?",
        choices: [
          "This photo is a cat",
          "This house is worth 84 lakhs",
          "The next word in a poem might be river"
        ],
        answer: 0,
        why: "Classification picks a category. A price is a number on a scale. Guessing a next word is how a language model continues text."
      }
    },
    {
      id: "neural-network",
      term: "Neural network",
      short: "Neural",
      emblem: "⚛",
      ring: 2,
      sentence: "A model made of many small connected units. Each unit passes a signal on, and training adjusts how strongly the connections fire.",
      analogy: "A relay team. Each runner carries the message a short way and hands it on. Together they cover a distance no single runner was given in full.",
      meet: "A photo app that recognizes a face is usually a neural network trained on many faces.",
      say: "Many small units learned this together.",
      nearby: ["deep-learning", "model", "training", "large-language-model"],
      check: {
        prompt: "A neural network is…",
        choices: [
          "Many connected units that pass signals and learn by adjusting those connections",
          "A single if-then rule written by hand",
          "The label on one training photo"
        ],
        answer: 0,
        why: "The network is the connected structure that learns. One handwritten rule is an algorithm of a simpler kind. One label belongs to one example."
      }
    },
    {
      id: "deep-learning",
      term: "Deep learning",
      short: "Deep",
      emblem: "☰",
      ring: 2,
      sentence: "Machine learning that uses neural networks with many layers, so simple details can be built up into richer patterns.",
      analogy: "Reading: letters, then words, then sentences, then the point of the paragraph. Each layer works with what the layer before it passed up.",
      meet: "Voice transcription and modern photo recognition grew up with deep learning.",
      say: "Many layers of a neural network learned this.",
      nearby: ["neural-network", "machine-learning", "large-language-model"],
      check: {
        prompt: "What makes learning “deep” in this vocabulary?",
        choices: [
          "A neural network with many layers",
          "A data set stored in a deep drawer",
          "A test that the student finds difficult"
        ],
        answer: 0,
        why: "Deep learning means many layers in a neural network, each building on the last. The word is about that structure."
      }
    },
    {
      id: "token",
      term: "Token",
      short: "Token",
      emblem: "•",
      ring: 2,
      sentence: "A small piece of text a language model reads or writes — often a word, or a piece of a word.",
      analogy: "Beads on a string. The model handles one bead at a time. The sentence is the whole strand.",
      meet: "The word “learning” may be one token. A longer or rarer word may be split into two or three tokens.",
      say: "This is one bead of text.",
      nearby: ["prompt", "large-language-model", "embedding"],
      check: {
        prompt: "A token is…",
        choices: [
          "A small piece of text the language model handles",
          "The reward a game agent receives",
          "The accuracy of a test set"
        ],
        answer: 0,
        why: "Tokens are the text pieces. A reward belongs to reinforcement learning. Accuracy is a score on examples."
      }
    },
    {
      id: "prompt",
      term: "Prompt",
      short: "Prompt",
      emblem: "✎",
      ring: 2,
      sentence: "The message you give a language model so it can start its reply: a question, an instruction, or a text you want continued.",
      analogy: "The first line you hand a poet, asking them to continue in that spirit.",
      meet: "“Explain overfitting with a school example, in four sentences” is a prompt.",
      say: "This is what you asked the model.",
      nearby: ["large-language-model", "token", "fine-tuning"],
      check: {
        prompt: "Which of these is a prompt?",
        choices: [
          "“Explain overfitting with a school example.”",
          "The percentage of test answers that matched",
          "The folder of photos used in training"
        ],
        answer: 0,
        why: "A prompt is the message you give the model. The percentage is accuracy. The folder is data."
      }
    },
    {
      id: "large-language-model",
      term: "Large language model",
      short: "LLM",
      emblem: "✶",
      ring: 2,
      sentence: "A large neural network trained to continue text. It can answer, translate, summarize, and draft because it has studied a vast amount of writing and then predicts likely next tokens.",
      analogy: "A widely read colleague who drafts a reply in a fitting voice. The draft is a chain of likely next words, guided by what they studied and by what you asked.",
      meet: "The chat box on a modern AI site is a large language model with a conversation wrapped around it.",
      say: "This model writes by predicting likely next words.",
      nearby: ["token", "prompt", "embedding", "hallucination", "fine-tuning", "retrieval-augmented-generation"],
      check: {
        prompt: "A large language model produces a reply by…",
        choices: [
          "Predicting likely next pieces of text",
          "Looking up one fixed sentence for every question in a printed book",
          "Sorting buttons by color with no text involved"
        ],
        answer: 0,
        why: "An LLM continues text token by token. A single printed sentence for every question would be a lookup table. Sorting buttons is an unsupervised picture, not a language model."
      }
    },
    {
      id: "embedding",
      term: "Embedding",
      short: "Embed",
      emblem: "⌖",
      ring: 2,
      sentence: "A list of numbers that places a word, a sentence, or an image on a map, so similar meanings sit near each other.",
      analogy: "A city map where cafés cluster. Two cafés with similar menus end up on the same street even when their names differ.",
      meet: "Search that finds “reset my password” when the help article says “recover account access” is using embeddings.",
      say: "Similar meanings get nearby numbers.",
      nearby: ["token", "large-language-model", "retrieval-augmented-generation"],
      check: {
        prompt: "An embedding helps a program…",
        choices: [
          "Place similar meanings near each other",
          "Guarantee every sentence is a historical fact",
          "Replace the need to test a model"
        ],
        answer: 0,
        why: "Embeddings are a map of similarity. They do not by themselves make a sentence historically true, and testing is still how we check a model."
      }
    },
    {
      id: "hallucination",
      term: "Hallucination",
      short: "Hallu",
      emblem: "◌",
      ring: 2,
      sentence: "A fluent answer that does not match the facts, or does not match the source the model was given.",
      analogy: "A storyteller who meets a gap in memory and fills it with a vivid detail. The sentence sounds finished. The detail was never in the book.",
      meet: "A model names a research paper that was never published, and offers a confident title and year.",
      say: "The sentence is fluent, and the fact is missing.",
      nearby: ["large-language-model", "retrieval-augmented-generation", "prompt"],
      check: {
        prompt: "A hallucination in this vocabulary is…",
        choices: [
          "Fluent text that is not supported by the facts or the given source",
          "A perfect score on a test the model has never seen",
          "A feature such as the number of rooms"
        ],
        answer: 0,
        why: "The word names confident, fluent text that is ungrounded. A strong test score is accuracy. Number of rooms is a feature."
      }
    },
    {
      id: "fine-tuning",
      term: "Fine-tuning",
      short: "Tune",
      emblem: "⚙",
      ring: 2,
      sentence: "Further training of a model that already learned a broad skill, using a smaller set of examples so it fits a particular job or voice.",
      analogy: "A cook who already knows the kitchen, then spends a month in one coastal house and picks up that house’s recipes.",
      meet: "Taking a general language model and training it further on a clinic’s own answered questions, so replies follow that clinic’s steps.",
      say: "Extra practice for a specific job.",
      nearby: ["training", "large-language-model", "prompt"],
      check: {
        prompt: "Fine-tuning means…",
        choices: [
          "Extra training of an existing model on a focused set of examples",
          "Deleting the model and starting from an empty page",
          "Asking a question in the chat box one time"
        ],
        answer: 0,
        why: "Fine-tuning continues training on a narrower set. One question in the chat is a prompt, and it leaves the model’s training as it was."
      }
    },
    {
      id: "retrieval-augmented-generation",
      term: "Retrieval-augmented generation",
      short: "RAG",
      emblem: "⌕",
      ring: 2,
      sentence: "A way of answering where the model first gathers relevant notes from a trusted collection, then writes the reply with those notes in front of it.",
      analogy: "An open-book reply. You find the right page, then answer in your own sentences with that page open.",
      meet: "A help assistant that searches the staff handbook and then answers from the page it found.",
      say: "It looked up notes, then wrote from them.",
      nearby: ["large-language-model", "embedding", "hallucination", "prompt"],
      check: {
        prompt: "Retrieval-augmented generation adds which step before the model writes?",
        choices: [
          "Gathering relevant notes from a collection",
          "Erasing the prompt so the model must guess the question",
          "Replacing every token with a picture"
        ],
        answer: 0,
        why: "RAG retrieves notes first, then the model writes with those notes as its source. That grounds the reply in material you chose."
      }
    }
  ];

  window.YM_LEARN_AI = { orbits: ym_orbits, words: ym_words };
})();
