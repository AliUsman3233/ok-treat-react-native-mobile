import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import { BackArrowIcon, ProgressTickIcon } from '../../../assets';
import { upsertBuildTrustSection } from '../../../services/buildTrustService';

const PASSING_SCORE = 5;

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'A dog you are watching suddenly starts limping. What should you do first?',
    options: [
      'Ignore it and hope it gets better',
      'Examine the paw gently for visible injuries and contact the owner',
      'Give the dog human pain medication',
      'Force the dog to walk it off',
    ],
    correctIndex: 1,
  },
  {
    id: 2,
    question: 'Which of these foods is toxic to dogs?',
    options: [
      'Carrots',
      'Plain cooked chicken',
      'Chocolate and grapes',
      'Rice',
    ],
    correctIndex: 2,
  },
  {
    id: 3,
    question: 'A cat you are caring for is hiding and refusing to eat. What is the best course of action?',
    options: [
      'Force-feed the cat',
      'Leave food nearby, give space, and notify the owner if it persists beyond 24 hours',
      'Ignore the behavior completely',
      'Take the cat outside for fresh air',
    ],
    correctIndex: 1,
  },
  {
    id: 4,
    question: 'What is the correct way to introduce two unfamiliar dogs?',
    options: [
      'Let them off leash immediately in an enclosed space',
      'Push them face-to-face so they can sniff each other',
      'Introduce them on neutral ground with both on leashes, allowing gradual sniffing',
      'Keep them in the same crate to bond faster',
    ],
    correctIndex: 2,
  },
  {
    id: 5,
    question: 'A pet has ingested something potentially toxic. What should you do?',
    options: [
      'Wait and see if symptoms appear',
      'Induce vomiting immediately with household items',
      'Contact the pet owner and call a veterinary emergency hotline right away',
      'Give the pet lots of water and food',
    ],
    correctIndex: 2,
  },
  {
    id: 6,
    question: 'How should you handle a pet that shows signs of heatstroke (excessive panting, drooling, lethargy)?',
    options: [
      'Put the pet in ice-cold water immediately',
      'Move the pet to a cool area, offer small amounts of water, apply cool (not ice cold) damp towels, and seek veterinary care',
      'Keep exercising to help them sweat it out',
      'Wrap the pet in a warm blanket',
    ],
    correctIndex: 1,
  },
  {
    id: 7,
    question: 'What information should you always have accessible when pet sitting?',
    options: [
      'Only the pet\'s name',
      'Owner contact, vet contact, pet medical history, and emergency procedures',
      'Just the owner\'s social media profile',
      'The pet\'s favorite toy brand',
    ],
    correctIndex: 1,
  },
];

export default function SafetyQuizScreen({ navigation }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectAnswer = (questionId, optionIndex) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    // Check all questions are answered
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    // Calculate score
    let correct = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    setScore(correct);
    setShowResults(true);
  };

  const handleSave = async () => {
    if (score >= PASSING_SCORE) {
      try {
        setIsSaving(true);

        const settings = {
          score,
          passed: true,
          completedAt: new Date().toISOString(),
        };

        const response = await upsertBuildTrustSection('SAFETY_QUIZ', settings, true);

        if (response.success) {
          navigation.navigate('ProfileSetup', { completedSection: 'safetyQuiz' });
        } else {
          Alert.alert('Error', 'Failed to save quiz results. Please try again.');
        }
      } catch (error) {
        console.error('Error saving safety quiz:', error);
        Alert.alert('Error', 'Failed to save quiz results. Please try again.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Reset quiz to try again
      setAnswers({});
      setShowResults(false);
      setScore(0);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Take a Safety Quiz</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Answer these pet safety questions to demonstrate your knowledge. You need at least {PASSING_SCORE} out of {QUIZ_QUESTIONS.length} correct to pass.
            </Text>
          </View>

          {/* Show Results Banner */}
          {showResults && (
            <View style={[styles.resultBanner, score >= PASSING_SCORE ? styles.resultPass : styles.resultFail]}>
              <Text style={styles.resultText}>
                You scored {score} out of {QUIZ_QUESTIONS.length}.{' '}
                {score >= PASSING_SCORE ? 'Congratulations, you passed!' : 'You need to retake the quiz.'}
              </Text>
            </View>
          )}

          {/* Questions */}
          {QUIZ_QUESTIONS.map((question, qIndex) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
              <Text style={styles.questionText}>{question.question}</Text>
              <View style={styles.optionsContainer}>
                {question.options.map((option, oIndex) => {
                  const isSelected = answers[question.id] === oIndex;
                  const isCorrect = question.correctIndex === oIndex;
                  const showCorrectWrong = showResults && isSelected;

                  return (
                    <TouchableOpacity
                      key={oIndex}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionSelected,
                        showResults && isCorrect && styles.optionCorrect,
                        showCorrectWrong && !isCorrect && styles.optionWrong,
                      ]}
                      onPress={() => handleSelectAnswer(question.id, oIndex)}
                      disabled={showResults}
                    >
                      <View style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}>
                        {isSelected && <ProgressTickIcon width={18} height={18} fill="#32A6D8" />}
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          {!showResults ? (
            <Button
              title="Submit Quiz"
              onPress={handleSubmitQuiz}
              type="secondary"
              size="large"
              fullWidth
            />
          ) : (
            <Button
              title={isSaving ? "Saving..." : score >= PASSING_SCORE ? "Continue" : "Retake Quiz"}
              onPress={handleSave}
              type="secondary"
              size="large"
              fullWidth
              disabled={isSaving}
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  infoCard: {
    padding: 15,
    backgroundColor: '#DAEFF8',
    borderRadius: 10,
  },
  infoText: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18,
  },
  resultBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultPass: {
    backgroundColor: 'rgba(63, 164, 119, 0.15)',
  },
  resultFail: {
    backgroundColor: 'rgba(245, 103, 84, 0.15)',
  },
  resultText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
  },
  questionCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
    borderRadius: 12,
    gap: 10,
  },
  questionNumber: {
    color: '#32A6D8',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  questionText: {
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21.7,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  optionSelected: {
    borderColor: '#32A6D8',
    backgroundColor: 'rgba(50, 166, 216, 0.05)',
  },
  optionCorrect: {
    borderColor: '#3FA477',
    backgroundColor: 'rgba(63, 164, 119, 0.1)',
  },
  optionWrong: {
    borderColor: '#F56754',
    backgroundColor: 'rgba(245, 103, 84, 0.1)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  radioCircleSelected: {
    borderColor: '#32A6D8',
  },
  optionText: {
    flex: 1,
    color: '#898D8F',
    fontSize: 13,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#0D0D12',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
