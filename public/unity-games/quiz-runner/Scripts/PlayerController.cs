using UnityEngine;

/// <summary>
/// Simple player controller for Quiz Runner
/// Player moves forward automatically, can be enhanced with obstacles
/// </summary>
public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float baseSpeed = 5f;
    public float speedBoost = 2f;
    public float speedPenalty = 0.5f;

    private float currentSpeed;
    private CharacterController controller;
    private Animator animator;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        animator = GetComponent<Animator>();
        currentSpeed = baseSpeed;
    }

    void Update()
    {
        // Move forward automatically
        Vector3 move = transform.forward * currentSpeed * Time.deltaTime;
        controller.Move(move);

        // Update animator
        if (animator != null)
        {
            animator.SetFloat("Speed", currentSpeed);
        }
    }

    /// <summary>
    /// Called when player answers correctly - give speed boost
    /// </summary>
    public void OnCorrectAnswer()
    {
        currentSpeed = baseSpeed * speedBoost;
        StartCoroutine(ResetSpeedAfterDelay(1f));
    }

    /// <summary>
    /// Called when player answers incorrectly - slow down
    /// </summary>
    public void OnWrongAnswer()
    {
        currentSpeed = baseSpeed * speedPenalty;
        StartCoroutine(ResetSpeedAfterDelay(1f));
    }

    System.Collections.IEnumerator ResetSpeedAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        currentSpeed = baseSpeed;
    }
}


