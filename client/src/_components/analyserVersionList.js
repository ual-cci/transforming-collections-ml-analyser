'use client'

import React, {useEffect, useRef, useState, version} from 'react'
import Link from 'next/link'
import ButtonModal from './buttonModal'
import { getGrade, checkChanges } from '@/_helpers/utills'
import EditableText from './editableText'

const AnalyserVersionList = ({
    analyser_id,
    analyser_version,
    analyser_versions,
    accuracy_target,
    onVersionChange=(()=>{})
}) => {

    const [versions, setVersions] = useState([])
    const [version_keeps, setVersionKeeps] = useState([])
    const [version_name, setVersionName] = useState("")
    const [chosen_version_id, setChosenVersionId] = useState("-1")
    const [top_version_id, setTopVersionId] = useState("-1")
  
    const updateVersionStatus = (current_keeps, version_id) => {

        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };

        let data = {}
        data['keep'] = current_keeps.includes(version_id) ? true : false

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version_details?" + new URLSearchParams({
            analyser_id:analyser_id,
            version:version_id,
            data: JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            console.log(res)
            onVersionChange()
        })
    }

    const updateVersionName = (version_id,name) => {

        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };

        let data = {}
        data['version_name'] = name

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version_details?" + new URLSearchParams({
            analyser_id:analyser_id,
            version:version_id,
            data: JSON.stringify(data)
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            console.log(res)
            onVersionChange()
        })
    }

    const changeAnalyserVersion = (analyser_id,version_id) => {

        const requestOptions = {
          method: 'GET',
          mode: 'cors',
          headers: {'Content-Type': 'application/json'},
        };
    
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_change_version?"+ new URLSearchParams({
          analyser_id:analyser_id,
          version:version_id
        }), requestOptions)
        .then(response => response.json())
        .then(res => {
            console.log(res)
            onVersionChange()
        })
    }

    const handleToggleStarVersion = (keeps, version_id) => {
        let current_keeps = JSON.parse(JSON.stringify(keeps))
        if (current_keeps.includes(version_id)){
            const index = current_keeps.indexOf(version_id)
            current_keeps.splice(index, 1)
        } else {
            current_keeps.push(version_id)
        }
        updateVersionStatus(current_keeps, version_id)
    }

    const onDeleteHandler = () => {

    }

    useEffect(() => {
        let sorted_versions = structuredClone(analyser_versions)
        sorted_versions.sort((a,b)=>{
            if ("accuracy" in a && "accuracy" in b){
                return b.accuracy-a.accuracy
            } else {
                return 0
            }
        })
        analyser_versions.sort((a,b)=>{
            if ("last_updated" in a && "last_updated" in b){
                return Date.parse(b.last_updated)-Date.parse(a.last_updated)
            } else {
                return 0
            }
        })
        setTopVersionId(sorted_versions[0]["id"])
        setVersions(analyser_versions)
        setChosenVersionId(analyser_version)
    }, [analyser_versions])



    useEffect(() => {
        if ((chosen_version_id != analyser_version) && (chosen_version_id != "-1")){
            changeAnalyserVersion(analyser_id,chosen_version_id)
        }
    }, [chosen_version_id])

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

    <table id="analyser-versions" className="table table-striped">
    <thead>
      <tr>
        <th>Version</th>
        <th>Last Updated</th>
        <th>Grade</th>
        <th>Train</th>
        <th>Test</th>
        <th>Changed</th>
        <th>Load</th>
        <th>Keep</th>
      </tr>
    </thead>
    <tbody>
    {versions.map(function(version, index, array) {
        let version_stats = version.id == chosen_version_id ? "current" : ""
        version_stats = [version_stats,version.id == top_version_id ? "top" : ""].join(" ")
        let pass = (parseFloat(version['accuracy'])>parseFloat(accuracy_target)) ? "pass" : ""
        version_stats = [version_stats,pass].join(" ")
        
      return (
          <tr key={"version-" + (version.id != undefined ? version.id : "")} className={version_stats} >
            <td>
                <EditableText
                    onEditSubmit={(name) => {updateVersionName(version.id,name)}}
                >
                    {(('version_name' in version) && (version['version_name'].length!=0)) ? version['version_name'] : "Version " + version.id}
                </EditableText>
            </td>
            <td> 
                {('last_updated' in version) ? (
                    version['last_updated']
                ):(<></>)}
            </td>
            <td> 
                {('accuracy' in version) ? (
                    <>
                        <b>{getGrade(accuracy_target,version['accuracy'])}</b>
                        <br/>
                        {" (" + Math.round(version['accuracy']*100) + "%) "}
                    </>
                ):(<></>)}
            </td>
            <td>
                {(version['examples'].length > 0) ? (
                    <>
                        {version['examples'].length}
                    </>
                ):(<></>)}
            </td>
            <td>
                {(version['sample_ids'].length > 0) ? (
                    <>
                        {version['sample_ids'].length}
                    </>
                ):(<></>)}
            </td>
            <td>
                {checkChanges(version, array[index+1])}
            </td>
            <td>  
                <button onClick={(e) => {
                    e.preventDefault()
                    setChosenVersionId(version.id)
                    }}>
                    <span className={"material-symbols-outlined"}>upload</span>
                </button>
            </td>
            <td>  
                <button onClick={(e) => {
                    e.preventDefault()
                    handleToggleStarVersion(version_keeps, version.id)
                    }}>
                    <span className={"material-symbols-outlined" + (('keep' in version) && (version['keep'].toString()=="true") ? " filled" : "" )}>star</span>
                </button>
            </td>
          </tr>
      )
    })}

    </tbody>
    </table>

    )
}

export default AnalyserVersionList