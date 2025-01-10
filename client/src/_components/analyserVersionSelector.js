'use client'

import React, {useEffect, useRef, useState, version} from 'react'

const AnalyserVersionSelector = ({
    analyser,
    onVersionChange=(()=>{})
}) => {

    const [versions, setVersions] = useState([])
    const [version_keeps, setVersionKeeps] = useState([])
    const [version_name, setVersionName] = useState("")
    const [chosen_version, setChosenVersion] = useState("-1")
  
    const updateVersionStatus = (current_keeps) => {

        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };

        let data = {}
        data['keep'] = current_keeps.includes(chosen_version) ? true : false

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version_details?" + new URLSearchParams({
            analyser_id:analyser['_id'],
            version:chosen_version,
            data: JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            console.log(res)
            onVersionChange()
        })
    }

    const updateVersionName = (name) => {

        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };

        let data = {}
        data['version_name'] = name

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version_details?" + new URLSearchParams({
            analyser_id:analyser['_id'],
            version:chosen_version,
            data: JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            console.log(res)
            onVersionChange()
        })
    }

    const changeAnalyserVersion = (analyser_id,chosen_version) => {

        const requestOptions = {
          method: 'GET',
          mode: 'cors',
          headers: {'Content-Type': 'application/json'},
        };
    
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version?"+ new URLSearchParams({
          analyser_id:analyser_id,
          version:chosen_version
        }), requestOptions)
        .then(response => response.json())
        .then(res => {
            console.log(res)
            onVersionChange()
        })
    }

    const handleToggleStarVersion = (keeps) => {
        let current_keeps = JSON.parse(JSON.stringify(keeps))
        if (current_keeps.includes(chosen_version)){
            const index = current_keeps.indexOf(chosen_version)
            current_keeps.splice(index, 1)
        } else {
            current_keeps.push(chosen_version)
        }
        updateVersionStatus(current_keeps)
    }

    useEffect(() => {
        console.log("got analyser")
        if ((analyser!=undefined) && ('versions' in analyser)){
            setVersions(analyser['versions'])
            setChosenVersion(analyser["version"])
        }
    }, [analyser])

    useEffect(() => {
        if (chosen_version != analyser['version'] && chosen_version != "-1"){
            changeAnalyserVersion(analyser['_id'],chosen_version)
            setVersionName("")
        }
    }, [chosen_version])

    useEffect(() => {
        let keeps = []
        versions.forEach((v) => {
            if ((v!=null) && ('keep' in v) && (v['keep'].toString() == "true")){
                keeps.push(v["id"])
            }
        })
        setVersionKeeps(keeps)
    }, [versions])

    return (

        <>
          {versions.length!=0 ? (
            <>
            <label>History: </label>
            <select name="version_id" required onChange={e => setChosenVersion(e.target.value)} 
              value={chosen_version}>
              <option value="-1">Loading versions...</option>
              {versions.map(function(version) {
                  if (version != null){
                    let version_str = "Version " + version.id
                    if ('last_updated' in version) {
                      version_str = 'version_name' in version ? (version['version_name'].length==0 ? "Untitled" : version['version_name']) + " (" + version['last_updated'] + ")" : version_str + " (" + version['last_updated'] + ")"
                    } else {
                        version_str = 'version_name' in version ? (version['version_name'].length==0 ? "Untitled" : version['version_name']) : version_str
                    }
                    return(
                      <option key={"version-"+version.id} value={ version.id }>{ ('keep' in version) && (version['keep'].toString()=="true") ? "★ " + version_str : version_str }</option>
                    )
                  }
                })}
            </select>
            <span className="version-config">
              <button onClick={(e) => {
                e.preventDefault()
                handleToggleStarVersion(version_keeps)
                }}><span className={"material-symbols-outlined" + (version_keeps.includes(chosen_version) ? " filled" : "" )}>star</span></button>
              <span>
                <label>Add Version Name (Optional):</label>
                <input type="text" name="version_name" 
                    onChange={e => setVersionName(e.target.value)} 
                    onBlur={e => updateVersionName(e.target.value)}
                    value={version_name}
                />
              </span>
            </span>
            <br/>
            </>
          ):<></>}
        </>
    )
}

export default AnalyserVersionSelector