/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:08.003Z */
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
