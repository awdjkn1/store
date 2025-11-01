import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

const ReviewList = ({ productId }) => {
	const [reviews, setReviews] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const res = await axios.get('/api/reviews', { params: { product_id: productId } });
			setReviews(res.data.reviews || []);
		} catch (err) {
			console.error('Error loading reviews:', err);
			setReviews([]);
		} finally {
			setLoading(false);
		}
	};

		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(() => { load(); }, [productId]);

	const handleSubmit = async (reviewData) => {
		try {
			const payload = {
				product_id: productId,
				rating: reviewData.rating,
				comment: reviewData.comment
			};
			const res = await axios.post('/api/reviews', payload);
			setReviews(res.data.reviews || []);
			setShowForm(false);
		} catch (err) {
			console.error('Error submitting review:', err);
		}
	};

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h3 style={{ color: 'var(--sb-text)', margin: 0 }}>Customer Reviews</h3>
				<button onClick={() => setShowForm(s => !s)} style={{ background: 'transparent', border: '1px solid var(--sb-border)', color: 'var(--sb-text)', padding: '8px 12px', borderRadius: '8px' }}>
					{showForm ? 'Cancel' : 'Write a review'}
				</button>
			</div>

			{showForm && <ReviewForm productId={productId} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />}

			{loading ? (
				<p style={{ color: 'var(--sb-muted)' }}>Loading reviews...</p>
			) : (
				<div>
								{reviews.length === 0 ? (
									<p style={{ color: 'var(--sb-muted)' }}>Be the first to review this product.</p>
								) : (
									reviews.map(r => (
										<ReviewCard key={r.id} review={{ ...r, customerName: (r.users && r.users.username) || r.user_name || 'Guest', date: r.created_at }} />
									))
								)}
				</div>
			)}
		</div>
	);
};

export default ReviewList;
