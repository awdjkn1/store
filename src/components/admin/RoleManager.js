/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.923Z */
import React from 'react';

const RoleManager = ({ admin }) => {
  // Stub: Display admin role and allow role assignment if superadmin
  return (
    <div>
      <h4>Role: {admin?.role}</h4>
      {/* Add role assignment UI for superadmin here */}
    </div>
  );
};

export default RoleManager;
