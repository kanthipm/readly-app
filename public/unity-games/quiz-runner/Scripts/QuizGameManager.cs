using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Main game manager for Quiz Runner game
/// Handles question display, answer validation, and game flow
/// </summary>
public class QuizGameManager : MonoBehaviour
{
    [Header("UI References")]
    public GameObject questionPanel;
    public Text questionText;
    public Button[] optionButtons;
    public Text scoreText;
    public Text feedbackText;
    public GameObject gameOverPanel;
    public Text finalScoreText;

    [Header("Game Settings")]
    public float timePerQuestion = 30f;
    public int pointsPerCorrectAnswer = 10;

    private List<QuizQuestion> questions = new List<QuizQuestion>();
    private int currentQuestionIndex = 0;
    private int score = 0;
    private bool isAnswering = false;
    private Coroutine questionTimer;

    // Singleton pattern
    public static QuizGameManager Instance { get; private set; }

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Start()
    {
        InitializeUI();
        // Register JavaScript callback
        #if UNITY_WEBGL && !UNITY_EDITOR
        Application.ExternalCall("RegisterUnityInstance", gameObject.name);
        #endif
    }

    void InitializeUI()
    {
        if (questionPanel != null)
            questionPanel.SetActive(false);
        
        if (gameOverPanel != null)
            gameOverPanel.SetActive(false);

        // Setup option buttons
        for (int i = 0; i < optionButtons.Length; i++)
        {
            int index = i; // Capture for closure
            optionButtons[i].onClick.AddListener(() => OnOptionSelected(index));
        }
    }

    /// <summary>
    /// Called from JavaScript to load questions into the game
    /// </summary>
    public void LoadQuestions(string questionsJson)
    {
        try
        {
            QuizQuestionList questionList = JsonUtility.FromJson<QuizQuestionList>(questionsJson);
            questions = questionList.questions;
            
            Debug.Log($"Loaded {questions.Count} questions");
            
            if (questions.Count > 0)
            {
                StartGame();
            }
            else
            {
                Debug.LogError("No questions loaded!");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading questions: {e.Message}");
        }
    }

    void StartGame()
    {
        currentQuestionIndex = 0;
        score = 0;
        UpdateScore();
        ShowNextQuestion();
    }

    void ShowNextQuestion()
    {
        if (currentQuestionIndex >= questions.Count)
        {
            EndGame();
            return;
        }

        QuizQuestion currentQuestion = questions[currentQuestionIndex];
        questionText.text = currentQuestion.question;

        // Update option buttons
        for (int i = 0; i < optionButtons.Length; i++)
        {
            if (i < currentQuestion.options.Length)
            {
                optionButtons[i].gameObject.SetActive(true);
                optionButtons[i].GetComponentInChildren<Text>().text = currentQuestion.options[i];
            }
            else
            {
                optionButtons[i].gameObject.SetActive(false);
            }
        }

        questionPanel.SetActive(true);
        isAnswering = true;
        feedbackText.text = "";

        // Start timer
        if (questionTimer != null)
            StopCoroutine(questionTimer);
        questionTimer = StartCoroutine(QuestionTimer());
    }

    IEnumerator QuestionTimer()
    {
        float timeLeft = timePerQuestion;
        while (timeLeft > 0 && isAnswering)
        {
            timeLeft -= Time.deltaTime;
            yield return null;
        }

        if (isAnswering)
        {
            // Time's up - mark as wrong
            OnTimeUp();
        }
    }

    void OnTimeUp()
    {
        isAnswering = false;
        QuizQuestion currentQuestion = questions[currentQuestionIndex];
        ShowFeedback(false, currentQuestion.explanation);
        StartCoroutine(NextQuestionAfterDelay(2f));
    }

    void OnOptionSelected(int optionIndex)
    {
        if (!isAnswering)
            return;

        isAnswering = false;
        QuizQuestion currentQuestion = questions[currentQuestionIndex];
        string selectedAnswer = currentQuestion.options[optionIndex];
        bool isCorrect = selectedAnswer == currentQuestion.answer;

        // Highlight selected button
        ColorBlock colors = optionButtons[optionIndex].colors;
        colors.normalColor = isCorrect ? Color.green : Color.red;
        optionButtons[optionIndex].colors = colors;

        if (isCorrect)
        {
            score += pointsPerCorrectAnswer;
            UpdateScore();
            ShowFeedback(true, currentQuestion.explanation);
        }
        else
        {
            ShowFeedback(false, currentQuestion.explanation);
        }

        // Disable all buttons
        foreach (Button btn in optionButtons)
        {
            btn.interactable = false;
        }

        // Notify JavaScript of answer
        #if UNITY_WEBGL && !UNITY_EDITOR
        Application.ExternalCall("OnQuestionAnswered", isCorrect, currentQuestionIndex);
        #endif

        StartCoroutine(NextQuestionAfterDelay(2f));
    }

    void ShowFeedback(bool isCorrect, string explanation)
    {
        feedbackText.text = isCorrect 
            ? $"✓ Correct! {explanation}" 
            : $"✗ Wrong! {explanation}";
        feedbackText.color = isCorrect ? Color.green : Color.red;
    }

    IEnumerator NextQuestionAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);

        // Reset button colors and enable them
        foreach (Button btn in optionButtons)
        {
            ColorBlock colors = btn.colors;
            colors.normalColor = Color.white;
            btn.colors = colors;
            btn.interactable = true;
        }

        currentQuestionIndex++;
        ShowNextQuestion();
    }

    void UpdateScore()
    {
        if (scoreText != null)
            scoreText.text = $"Score: {score}";
    }

    void EndGame()
    {
        questionPanel.SetActive(false);
        gameOverPanel.SetActive(true);
        finalScoreText.text = $"Final Score: {score} / {questions.Count * pointsPerCorrectAnswer}";

        // Notify JavaScript of game completion
        #if UNITY_WEBGL && !UNITY_EDITOR
        Application.ExternalCall("OnGameComplete", score, questions.Count);
        #endif
    }

    public void RestartGame()
    {
        gameOverPanel.SetActive(false);
        StartGame();
    }
}

[Serializable]
public class QuizQuestion
{
    public string question;
    public string[] options;
    public string answer;
    public string explanation;
}

[Serializable]
public class QuizQuestionList
{
    public QuizQuestion[] questions;
}


