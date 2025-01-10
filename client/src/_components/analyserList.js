'use client'
 
import { useState, useEffect } from 'react'
import LoaderButton from './loaderButton';
import Link from 'next/link';
import { dateFromObjectId, formatAnalyserType } from '@/_helpers/utills';
import ButtonModal from './buttonModal'

const AnalyserList = ({
  user_id,
  analysers=[{
    id:"Loading...",
    name:" ",
    dataset_id:"",
    dataset_name:"Loading...",
    category_id:"",
    category_name:"Loading...",
    analyser_id:""}], 
  onDeleteHandler
}) => {

  console.log(analysers)

  analysers.sort(function(a,b){
    if ((a!= null) && (b != null)){
      let a_date = 'last_updated' in a ? new Date(a['last_updated']) : (("_id" in a) ? dateFromObjectId(a._id) : "")
      let b_date = 'last_updated' in b ? new Date(b['last_updated']) : (("_id" in b) ? dateFromObjectId(b._id) : "")
      return b_date - a_date;
    } else {
      return 0
    }

  });

  return (
    <table id="analysers" className="table table-striped">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Dataset</th>
        {/* <th>Category</th> */}
        <th>Last Updated</th>
        <th>Availability</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {analysers.map(function(analyser) {
        if (analyser!= null){
          return (
            <tr key={"analyser-" + (analyser._id != undefined ? analyser._id : "")}>
              <td>
                {(analyser._id != undefined) ? (
                  <Link href={"/analyser?analyser_id=" + analyser._id} > 
                    { analyser.name.length>0 ? analyser.name : "* Untitled *" } 
                  </Link>
                ) : <></>}
              </td>
              <td> { formatAnalyserType(analyser.analyser_type) } </td>
              <td> { analyser.dataset_name } </td>
              {/* <td> { analyser.category_name } </td> */}
              <td>
                { 'last_updated' in analyser ? (new Date(analyser['last_updated']).toLocaleString()) : (("_id" in analyser) ? dateFromObjectId(analyser._id).toLocaleString() : "") }
              </td>
              <td>
              { 'owner' in analyser && analyser.owner == user_id ? (
                "Private"
              ) : (
                "Public"
              )}
              </td>
              <td>
              { 'owner' in analyser && analyser.owner == user_id ? (
                <ButtonModal 
                  onPressHandler={onDeleteHandler} 
                  id={analyser._id} 
                  title={"Delete Analyser"}
                  iconName="delete"
                  warningText="Note: Any associated datasets and labelsets will NOT be removed"
                  buttonActionText="Delete"
                >
                  {"Are you sure you want to permanently delete" + (analyser.name.length>0 ? (" analyser '" + analyser.name + "' ") : " this analyser") + "?"}
                </ButtonModal>
              ) : (
                <></>
              )}

              </td>
            </tr>
          )
        } else {
          return
        }
      })}
    </tbody>
    </table>
  );
}

export default AnalyserList;