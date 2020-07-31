const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { LinkedList, _Node, toArray } = require('../linkedlist');

const languageRouter = express.Router();
const jsonParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: `You don't have any languages`,
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  // implement me
  try {
    const [nextWord] = await LanguageService.getNextWord(
      req.app.get('db'),
      req.language.id
    );
    let data = res.json({
      nextWord: nextWord.original,
      totalScore: req.language.total_score,
      wordCorrectCount: nextWord.correct_count,
      wordIncorrectCount: nextWord.incorrect_count,
    });
    next();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', jsonParser, async (req, res, next) => {
  // implement me
  // res.send('implement me!')
  const guess = req.body.guess;
  if (!guess) {
    res.status(400).json({
      error: `Missing 'guess' in request body`,
    });
  }

  try {
    //get words for that user from the database (getLanguageWords)
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );
    //get the start of the word list (getLanguageHead)
    const [{ head }] = await LanguageService.getLanguageHead(
      req.app.get('db'),
      req.language.id
    );
    //create linked list of the user's words
    const list = LanguageService.createLinkedList(words, head);
    const [checkNextWord] = await LanguageService.checkGuess(
      req.app.get('db'),
      req.language.id
    );
    //if their guess is correct, update the memory value of the current word, move the word back in the list
    if (checkNextWord.translation === guess) {
      const newMemoryValue = list.head.value.memory_value * 2;
      list.head.value.memory_value = newMemoryValue;
      list.head.value.correct_count++;

      let current = list.head;
      let counter = newMemoryValue;
      while (counter > 0 && current.next !== null) {
        current = current.next;
        counter--;
      }
      const temp = new _Node(list.head.value);

      if (current.next === null) {
        temp.next = current.next;
        current.next = temp;
        list.head = list.head.next;
        current.value.next = temp.value.id;
        temp.value.next = null;
      } else {
        temp.next = current.next;
        current.next = temp;
        list.head = list.head.next;
        current.value.next = temp.value.id;
        temp.value.next = temp.next.value.id;
      }
      req.language.total_score++;
      await LanguageService.updateWordsTable(
        req.app.get('db'),
        toArray(list),
        req.language.id,
        req.language.total_score
      );
      res.json({
        nextWord: list.head.value.original,
        totalScore: req.language.total_score,
        wordCorrectCount: list.head.value.correct_count,
        wordIncorrectCount: list.head.value.incorrect_count,
        answer: temp.value.translation,
        isCorrect: true,
      });
    }
    //if their guess is incorrect, reset the memory value of the current word to 1, move the word back one space
    else {
      list.head.value.memory_value = 1;
      list.head.value.incorrect_count++;

      let current = list.head;
      let counter = 1;
      while (counter > 0) {
        current = current.next;
        counter--;
      }

      const temp = new _Node(list.head.value);
      temp.next = current.next;
      current.next = temp;
      list.head = list.head.next;
      current.value.next = temp.value.id;
      temp.value.next = temp.next.value.id;

      //once the list is correct, persist the changes to the database
      await LanguageService.updateWordsTable(
        req.app.get('db'),
        toArray(list),
        req.language.id,
        req.language.total_score
      );
      res.json({
        nextWord: list.head.value.original,
        totalScore: req.language.total_score,
        wordCorrectCount: list.head.value.correct_count,
        wordIncorrectCount: list.head.value.incorrect_count,
        answer: temp.value.translation,
        isCorrect: false,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
