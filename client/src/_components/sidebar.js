'use client'

import { 
    Sidebar,
    Menu,
    SubMenu,
    MenuItem
  } from "react-pro-sidebar";
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from "@auth0/nextjs-auth0/client";
import logo from '../../public/ual-logo.png'
import { useState } from "react";

const SideBar = () => {

    const { user, error, isLoading } = useUser();

    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="sidebar-container flex">
        <Sidebar collapsed={collapsed}>
            <div className="sidebar-title">
                {collapsed ? (
                    <h4>T C M A</h4>
                ) 
                : (
                    <h4>Transforming Collections:<p>ML App</p></h4>
                )}
                
            </div>
            <button className="sidebar-expander" onClick={(e)=>{setCollapsed(!collapsed)}}>{collapsed ? (
                <>
                    <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
                </>
            )}</button>
            <Menu>
                    <MenuItem icon={<span className='material-symbols-outlined'>home</span>} component={<Link href="/" />}> Home </MenuItem>
                    <MenuItem icon={<span className='material-symbols-outlined'>upload</span>} component={<Link href="/uploaddataset" />}> New Dataset </MenuItem>
                    <MenuItem icon={<span className='material-symbols-outlined'>saved_search</span>} component={<Link href="/analyser" />}> New Analyser </MenuItem>
                    <MenuItem icon={<span className='material-symbols-outlined'>label</span>} component={<Link href="/labelsets" />}> Labelsets </MenuItem>
                    {/* <MenuItem icon={<span className='material-symbols-outlined'>category</span>} component={<Link href="/managecategories" />}> Categories </MenuItem> */}
                    <hr></hr>
                    {user ? (
                        <MenuItem icon={<span className='material-symbols-outlined'>logout</span>} component={<a href="/api/auth/logout"/>}> Logout ({user.name === user.email ? user.nickname : user.name})</MenuItem> 
                    )
                    : (
                        <MenuItem icon={<span className='material-symbols-outlined'>login</span>} component={<a href="/api/auth/login"/>}> Login </MenuItem> 
                    )}
                </Menu>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Image 
                src={logo}
                width={collapsed ? 50 : 150}
                alt="University Arts London Logo"
                />
            </div>

        </Sidebar>
        </div>
    )
}

export default SideBar