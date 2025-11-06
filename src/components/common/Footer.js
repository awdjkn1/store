import React from 'react';
import { Shield, MapPin, Phone, Mail, Heart, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();

	const footerStyle = {
		backgroundColor: 'var(--sb-bg)',
		borderTop: '1px solid var(--sb-border)',
		marginTop: '80px'
	};

	const containerStyle = {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '60px 20px 20px'
	};

	const contactFixedStyle = {
		position: 'fixed',
		left: 16,
		bottom: 16,
		background: 'var(--sb-surface)',
		color: 'var(--sb-text)',
		padding: '0.6rem 0.9rem',
		borderRadius: 8,
		boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
		zIndex: 1200
	};

	const adminButtonStyle = {
		position: 'fixed',
		right: 16,
		bottom: 16,
		background: 'var(--sb-accent)',
		color: 'var(--sb-accent-on)',
		padding: '0.6rem',
		borderRadius: 999,
		border: 'none',
		cursor: 'pointer',
		boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
		zIndex: 1200,
		display: 'flex',
		alignItems: 'center'
	};

	const gridStyle = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: '40px',
		marginBottom: '40px'
	};

	const sectionStyle = {
		color: 'var(--sb-text)'
	};

	const headingStyle = {
		fontSize: '20px',
		fontWeight: '700',
		marginBottom: '20px',
		color: 'var(--sb-accent)'
	};

	const linkStyle = {
		color: 'var(--sb-muted)',
		textDecoration: 'none',
		display: 'block',
		padding: '8px 0',
		transition: 'all 0.3s ease',
		fontSize: '14px'
	};

	const bottomBarStyle = {
		borderTop: '1px solid var(--sb-border)',
		paddingTop: '20px',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '20px',
		color: 'var(--sb-muted)'
	};

	return (
		<>
			{/* Fixed contact and admin buttons */}
			<div style={contactFixedStyle}>
				<a href="/contact" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Contact Us</a>
			</div>

			<button
				style={adminButtonStyle}
				onClick={() => navigate('/admin')}
				title="Admin"
				aria-label="Admin"
			>
				<Shield size={16} />
			</button>

			{/* Main footer */}
			<footer style={footerStyle}>
				<div style={containerStyle}>
					<div style={gridStyle}>
						<div style={sectionStyle}>
							<h3 style={headingStyle}>Your Store</h3>
							<p style={{ color: 'var(--sb-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
								Shenzhen Bricks specializes in high-quality LEGO sets, rare collectibles, and custom-compatible bricks for builders and collectors worldwide. Our catalogue features new releases, retired classics, and carefully inspected parts so you can build with confidence.
							</p>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
								<MapPin size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
									123 Business Street, City, State 12345
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
								<Phone size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
									+1 (555) 123-4567
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								<Mail size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
									support@yourstore.com
								</span>
							</div>
						</div>

						<div style={sectionStyle}>
							<h3 style={headingStyle}>Quick Links</h3>
							<a href="/products" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
								All Products
							</a>
							<a href="/about" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
								About Us
							</a>
							<a href="/contact" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
								Contact
							</a>
							<a href="/cart" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
								Shopping Cart
							</a>
							<a href="/checkout" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
								Checkout
							</a>
						</div>

						<div style={sectionStyle}>
							<h3 style={headingStyle}>Customer Service</h3>
							<a href="/faq" style={linkStyle}>FAQ</a>
							<a href="/shipping" style={linkStyle}>Shipping Information</a>
							<a href="/returns" style={linkStyle}>Returns & Exchanges</a>
							<a href="/privacy" style={linkStyle}>Privacy Policy</a>
							<a href="/terms" style={linkStyle}>Terms of Service</a>
						</div>

						<div style={sectionStyle}>
							<h3 style={headingStyle}>Stay Connected</h3>
							<p style={{ color: 'var(--sb-muted)', marginBottom: '20px', fontSize: '14px' }}>
								Subscribe to get special offers and updates
							</p>
							<div style={{ display: 'flex', marginBottom: '20px' }}>
								<input type="email" placeholder="Enter your email" style={{ flex: '1', padding: '12px', backgroundColor: 'var(--sb-surface)', border: '1px solid var(--sb-border)', borderRadius: '4px 0 0 4px', color: 'var(--sb-text)', fontSize: '14px' }} />
								<button style={{ padding: '12px 20px', backgroundColor: 'var(--sb-accent)', color: 'var(--sb-accent-on)', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: '600' }}>Subscribe</button>
							</div>
							<div>
								<a href="#" style={{ marginRight: 8 }}><Facebook size={18} /></a>
								<a href="#" style={{ marginRight: 8 }}><Twitter size={18} /></a>
								<a href="#" style={{ marginRight: 8 }}><Instagram size={18} /></a>
								<a href="#"><Youtube size={18} /></a>
							</div>
						</div>
					</div>

					<div style={bottomBarStyle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
							<span>© {currentYear} Your Store. Made with</span>
							<Heart size={16} style={{ color: 'var(--sb-accent)', fill: 'var(--sb-accent)' }} />
							<span>for our customers</span>
						</div>

						<div>
							<span style={{ display: 'inline-block', padding: '8px 12px', backgroundColor: 'var(--sb-surface)', borderRadius: '4px', margin: '0 8px 8px 0', fontSize: '12px', color: 'var(--sb-text)', fontWeight: '600' }}>HoodPay</span>
							<span style={{ display: 'inline-block', padding: '8px 12px', backgroundColor: 'var(--sb-surface)', borderRadius: '4px', margin: '0 8px 8px 0', fontSize: '12px', color: 'var(--sb-text)', fontWeight: '600' }}>VISA</span>
							<span style={{ display: 'inline-block', padding: '8px 12px', backgroundColor: 'var(--sb-surface)', borderRadius: '4px', margin: '0 8px 8px 0', fontSize: '12px', color: 'var(--sb-text)', fontWeight: '600' }}>MASTER</span>
							<span style={{ display: 'inline-block', padding: '8px 12px', backgroundColor: 'var(--sb-surface)', borderRadius: '4px', margin: '0 8px 8px 0', fontSize: '12px', color: 'var(--sb-text)', fontWeight: '600' }}>PAYPAL</span>
						</div>
					</div>
				</div>
			</footer>
		</>
	);
};

export default Footer;