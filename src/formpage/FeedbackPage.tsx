import React, { useState } from 'react';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState({
    rating: 5,
    message: '',
    category: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedback);
    alert('Thank you for your feedback!');
    setFeedback({ rating: 5, message: '', category: 'general' });
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Feedback</h2>
      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">How would you rate your experience?</h3>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-3xl transition-colors duration-200 ${
                    feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                  onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Category</h3>
            <select
              value={feedback.category}
              onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Your Message</h3>
            <textarea
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us what you think..."
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px]"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage; 