import React, { useState } from 'react';

const ContactButton = ({ email = 'support@yourstore.com' }) => {
  const [hover, setHover] = useState(false);

  return (
    <a
      className="contact-us-button"
      href={`mailto:${email}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={hover ? `Email ${email}` : 'Contact Us'}
      role="link"
      title={hover ? email : 'Contact Us'}
      style={{ textDecoration: 'none', display: 'inline-block' }}
    >
      {hover ? email : 'Contact Us'}
    </a>
  );
};

export default ContactButton;
