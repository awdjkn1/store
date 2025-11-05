import React, { useState } from 'react';

const skeletonStyle = (width = '100%', height = '100%') => ({
  width,
  height,
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 37%, #f0f0f0 63%)',
  backgroundSize: '400% 100%',
  animation: 'shine 1.2s ease-in-out infinite',
  borderRadius: 6,
});

const imgStyleDefaults = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

// Simple image component that shows a skeleton until the image has loaded.
const ImageWithPlaceholder = ({ src, alt = '', style = {}, className = '', placeholder = '', ...rest }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const onLoad = (e) => {
    setLoaded(true);
    if (rest.onLoad) rest.onLoad(e);
  };

  const onError = (e) => {
    setErrored(true);
    if (rest.onError) rest.onError(e);
  };

  const finalSrc = errored && placeholder ? placeholder : src;

  return (
    <div style={{ position: 'relative', width: style.width || '100%', height: style.height || '100%' }} className={className}>
      {!loaded && (
        <div style={skeletonStyle(style.width || '100%', style.height || '100%')} />
      )}
      <img
        src={finalSrc}
        alt={alt}
        style={{ ...imgStyleDefaults, ...style, display: loaded ? 'block' : 'none' }}
        loading="lazy"
        onLoad={onLoad}
        onError={onError}
        {...rest}
      />
      <style>{`@keyframes shine { 0%{background-position: -200% 0} 100%{background-position: 200% 0} }`}</style>
    </div>
  );
};

export default ImageWithPlaceholder;
