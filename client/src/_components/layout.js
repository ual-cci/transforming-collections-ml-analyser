'use client'

import SideBar from './sidebar'

const RootLayout = ({ children }) => {
  return (
    <>
    <div style={{ display: 'flex', height: '100%' }}>
      <SideBar />
      <div className="page-content">{children}</div>
    </div>
    </>
  );
};

export default RootLayout;