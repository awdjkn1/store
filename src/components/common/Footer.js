/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:08.012Z */
import React from 'react';
import { MapPin, Phone, Mail, Heart, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();

	const footerStyle = {
		backgroundColor: 'var(--sb-bg)',
		borderTop: '0.0625rem solid var(--sb-border)',
		marginTop: '5rem'
	};

	const containerStyle = {
		maxWidth: '75rem',
		margin: '0 auto',
		padding: '3.75rem 1.25rem 1.25rem'
	};

	const contactFixedStyle = {
		position: 'fixed',
		left: 16,
		bottom: 16,
		background: 'var(--sb-surface)',
		color: 'var(--sb-text)',
		padding: '0.6rem 0.9rem',
		borderRadius: 8,
		boxShadow: '0 0.375rem 1.25rem rgba(0,0,0,0.25)',
		zIndex: 1200
	};


	const gridStyle = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(15.625rem, 1fr))',
		gap: '2.5rem',
		marginBottom: '2.5rem'
	};

	const sectionStyle = {
		color: 'var(--sb-text)'
	};

	const headingStyle = {
		fontSize: '1.25rem',
		fontWeight: '700',
		marginBottom: '1.25rem',
		color: 'var(--sb-accent)'
	};

	const linkStyle = {
		color: 'var(--sb-muted)',
		textDecoration: 'none',
		display: 'block',
		padding: '0.5rem 0',
		transition: 'all 0.3s ease',
		fontSize: '0.875rem'
	};

	const bottomBarStyle = {
		borderTop: '0.0625rem solid var(--sb-border)',
		paddingTop: '1.25rem',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '1.25rem',
		color: 'var(--sb-muted)'
	};

	return (
		<>



			{/* Main footer */}
			<footer style={footerStyle}>
				<div style={containerStyle}>
					<div style={gridStyle}>
						<div style={sectionStyle}>
							<h3 style={headingStyle}>Your Store</h3>
							<p style={{ color: 'var(--sb-muted)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
								Shenzhen Bricks specializes in high-quality LEGO sets, rare collectibles, and custom-compatible bricks for builders and collectors worldwide. Our catalogue features new releases, retired classics, and carefully inspected parts so you can build with confidence.
							</p>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
								<MapPin size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>
									123 Business Street, City, State 12345
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
								<Phone size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>
									+1 (555) 123-4567
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
								<Mail size={16} style={{ color: 'var(--sb-accent)' }} />
								<span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>
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
							<p style={{ color: 'var(--sb-muted)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
								Subscribe to get special offers and updates
							</p>
							<div style={{ display: 'flex', marginBottom: '1.25rem' }}>
								<input type="email" placeholder="Enter your email" style={{ flex: '1', padding: '0.75rem', backgroundColor: 'var(--sb-surface)', border: '0.0625rem solid var(--sb-border)', borderRadius: '0.25rem 0 0 0.25rem', color: 'var(--sb-text)', fontSize: '0.875rem' }} />
								<button style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--sb-accent)', color: 'var(--sb-accent-on)', border: 'none', borderRadius: '0 0.25rem 0.25rem 0', cursor: 'pointer', fontWeight: '600' }}>Subscribe</button>
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
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
							<span>© {currentYear} Your Store. Made with</span>
							<Heart size={16} style={{ color: 'var(--sb-accent)', fill: 'var(--sb-accent)' }} />
							<span>for our customers</span>
						</div>

						<div>
							<span style={{ display: 'inline-block', padding: '0.5rem 0.75rem', backgroundColor: 'var(--sb-surface)', borderRadius: '0.25rem', margin: '0 0.5rem 0.5rem 0', fontSize: '0.75rem', color: 'var(--sb-text)', fontWeight: '600' }}>Card2Crypto</span>
							<span style={{ display: 'inline-block', padding: '0.5rem 0.75rem', backgroundColor: 'var(--sb-surface)', borderRadius: '0.25rem', margin: '0 0.5rem 0.5rem 0', fontSize: '0.75rem', color: 'var(--sb-text)', fontWeight: '600' }}>VISA</span>
							<span style={{ display: 'inline-block', padding: '0.5rem 0.75rem', backgroundColor: 'var(--sb-surface)', borderRadius: '0.25rem', margin: '0 0.5rem 0.5rem 0', fontSize: '0.75rem', color: 'var(--sb-text)', fontWeight: '600' }}>MASTER</span>
							<span style={{ display: 'inline-block', padding: '0.5rem 0.75rem', backgroundColor: 'var(--sb-surface)', borderRadius: '0.25rem', margin: '0 0.5rem 0.5rem 0', fontSize: '0.75rem', color: 'var(--sb-text)', fontWeight: '600' }}>PAYPAL</span>
						</div>
					</div>
				</div>
			</footer>
		</>
	);
};

export default Footer;