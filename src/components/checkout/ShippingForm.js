import React, { useState } from 'react';
import { Truck, MapPin, Clock, Shield } from 'lucide-react';

const ShippingForm = ({ onShippingChange, initialData = {} }) => {
  const [shippingData, setShippingData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    apartment: initialData.apartment || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    country: initialData.country || 'US',
    shippingMethod: initialData.shippingMethod || 'standard',
    saveAddress: initialData.saveAddress || false
  });

  const [errors, setErrors] = useState({});

  const containerStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #444'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #444'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  };

  const formRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  };

  const formGroupStyle = {
    marginBottom: '16px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#dc3545'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const errorStyle = {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '4px'
  };

  const checkboxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px'
  };

  const shippingOptionsStyle = {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333'
  };

  const shippingOptionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #444',
    borderRadius: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const shippingMethods = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 15,
      icon: Truck
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 25,
      icon: Clock
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      description: 'Next business day',
      price: 45,
      icon: Shield
    }
  ];

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setShippingData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Notify parent component
    onShippingChange({
      ...shippingData,
      [name]: newValue
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!shippingData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(shippingData.email)) newErrors.email = 'Email is invalid';
    if (!shippingData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!shippingData.address.trim()) newErrors.address = 'Address is required';
    if (!shippingData.city.trim()) newErrors.city = 'City is required';
    if (!shippingData.state.trim()) newErrors.state = 'State is required';
    if (!shippingData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingMethodSelect = (methodId) => {
    setShippingData(prev => ({
      ...prev,
      shippingMethod: methodId
    }));
    
    onShippingChange({
      ...shippingData,
      shippingMethod: methodId
    });
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <MapPin size={20} color="#ff6b35" />
        <h3 style={titleStyle}>Shipping Information</h3>
      </div>

      {/* Contact Information */}
      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={shippingData.firstName}
            onChange={handleInputChange}
            style={errors.firstName ? errorInputStyle : inputStyle}
            placeholder="Enter first name"
          />
          {errors.firstName && <div style={errorStyle}>{errors.firstName}</div>}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={shippingData.lastName}
            onChange={handleInputChange}
            style={errors.lastName ? errorInputStyle : inputStyle}
            placeholder="Enter last name"
          />
          {errors.lastName && <div style={errorStyle}>{errors.lastName}</div>}
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Email Address *</label>
          <input
            type="email"
            name="email"
            value={shippingData.email}
            onChange={handleInputChange}
            style={errors.email ? errorInputStyle : inputStyle}
            placeholder="Enter email address"
          />
          {errors.email && <div style={errorStyle}>{errors.email}</div>}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={shippingData.phone}
            onChange={handleInputChange}
            style={errors.phone ? errorInputStyle : inputStyle}
            placeholder="Enter phone number"
          />
          {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
        </div>
      </div>

      {/* Address Information */}
      <div style={formGroupStyle}>
        <label style={labelStyle}>Street Address *</label>
        <input
          type="text"
          name="address"
          value={shippingData.address}
          onChange={handleInputChange}
          style={errors.address ? errorInputStyle : inputStyle}
          placeholder="Enter street address"
        />
        {errors.address && <div style={errorStyle}>{errors.address}</div>}
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle}>Apartment, Suite, etc. (Optional)</label>
        <input
          type="text"
          name="apartment"
          value={shippingData.apartment}
          onChange={handleInputChange}
          style={inputStyle}
          placeholder="Apartment, suite, unit, etc."
        />
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>City *</label>
          <input
            type="text"
            name="city"
            value={shippingData.city}
            onChange={handleInputChange}
            style={errors.city ? errorInputStyle : inputStyle}
            placeholder="Enter city"
          />
          {errors.city && <div style={errorStyle}>{errors.city}</div>}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>State/Province *</label>
          <input
            type="text"
            name="state"
            value={shippingData.state}
            onChange={handleInputChange}
            style={errors.state ? errorInputStyle : inputStyle}
            placeholder="Enter state/province"
          />
          {errors.state && <div style={errorStyle}>{errors.state}</div>}
        </div>
      </div>

      <div style={formRowStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>ZIP/Postal Code *</label>
          <input
            type="text"
            name="zipCode"
            value={shippingData.zipCode}
            onChange={handleInputChange}
            style={errors.zipCode ? errorInputStyle : inputStyle}
            placeholder="Enter ZIP code"
          />
          {errors.zipCode && <div style={errorStyle}>{errors.zipCode}</div>}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Country *</label>
          <select
            name="country"
            value={shippingData.country}
            onChange={handleInputChange}
            style={selectStyle}
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipping Methods */}
      <div style={shippingOptionsStyle}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#ff6b35',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Truck size={18} />
          Shipping Method
        </h4>

        {shippingMethods.map(method => {
          const Icon = method.icon;
          const isSelected = shippingData.shippingMethod === method.id;
          
          return (
            <div
              key={method.id}
              style={{
                ...shippingOptionStyle,
                backgroundColor: isSelected ? '#ff6b35' : 'transparent',
                borderColor: isSelected ? '#ff6b35' : '#444',
                color: isSelected ? '#ffffff' : '#cccccc'
              }}
              onClick={() => handleShippingMethodSelect(method.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={20} />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    {method.name}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {method.description}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>
                ${method.price}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Address Checkbox */}
      <div style={checkboxStyle}>
        <input
          type="checkbox"
          name="saveAddress"
          id="saveAddress"
          checked={shippingData.saveAddress}
          onChange={handleInputChange}
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#ff6b35'
          }}
        />
        <label htmlFor="saveAddress" style={{
          fontSize: '14px',
          color: '#cccccc',
          cursor: 'pointer'
        }}>
          Save this address for future orders
        </label>
      </div>
    </div>
  );
};

export default ShippingForm;