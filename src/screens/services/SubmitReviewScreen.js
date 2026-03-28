import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, ProfileImagePersonIcon } from '../../assets';
import Button from '../../components/Button';
import api from '../../config/api';

export default function SubmitReviewScreen({ navigation, route }) {
  const { booking, sitter } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sitterName = sitter?.user?.fullName || sitter?.name || 'Sitter';
  const sitterImage = sitter?.user?.avatarUrl || sitter?.profileImage || null;
  const sitterId = sitter?.id || booking?.sitterId;
  const bookingId = booking?.id;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Rating Required', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/reviews', {
        sitterId,
        bookingId,
        rating,
        comment: comment.trim() || null,
      });

      if (response.data?.success) {
        Alert.alert('Thank You!', 'Your review has been submitted successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.data?.message || 'Failed to submit review');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to submit review';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <StarIcon
            width={36}
            height={36}
            fill={i <= rating ? '#FBBC04' : '#E0E0E0'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Your Experience</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sitter Info */}
        <View style={styles.sitterSection}>
          <View style={styles.sitterAvatar}>
            {sitterImage ? (
              <Image source={{ uri: sitterImage }} style={styles.sitterImage} />
            ) : (
              <ProfileImagePersonIcon width={64} height={64} />
            )}
          </View>
          <Text style={styles.sitterName}>{sitterName}</Text>
          {booking?.serviceType && (
            <Text style={styles.serviceType}>{booking.serviceType}</Text>
          )}
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>How was your experience?</Text>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Leave a comment (optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor="#B0B0B0"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={submitting ? 'Submitting...' : 'Submit Review'}
            onPress={handleSubmit}
            fullWidth
            size="medium"
            disabled={rating === 0 || submitting}
          />
        </View>

        {submitting && (
          <ActivityIndicator size="small" color="#32A6D8" style={styles.loader} />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  placeholder: {
    width: 40,
  },
  sitterSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  sitterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sitterImage: {
    width: 64,
    height: 64,
    borderRadius: 9999,
  },
  sitterName: {
    color: '#040404',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 24,
  },
  serviceType: {
    color: '#8D8E90',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ratingLabel: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    color: '#32A6D8',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginTop: 8,
  },
  commentSection: {
    paddingHorizontal: 24,
    flex: 1,
  },
  commentLabel: {
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentInput: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#040404',
    lineHeight: 22,
  },
  charCount: {
    textAlign: 'right',
    color: '#B0B0B0',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  loader: {
    marginTop: 8,
  },
});
