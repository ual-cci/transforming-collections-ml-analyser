'use client'
 
import { useState, useEffect } from 'react'
import LoaderButton from './loaderButton';
import { dateFromObjectId, formatAnalyserType } from '@/_helpers/utills';
import Link from 'next/link'
import ButtonModal from './buttonModal';
 
const LabelsetList = ({
  user,
  labelsets=[{id:"Loading...",name:" "}], 
  onDeleteHandler=()=>{}
}) => {

  labelsets.sort(function(a,b){
    let a_date = 'last_updated' in a ? new Date(a['last_updated']) : (("_id" in a) ? dateFromObjectId(a._id) : "")
    let b_date = 'last_updated' in b ? new Date(b['last_updated']) : (("_id" in b) ? dateFromObjectId(b._id) : "")
    return b_date - a_date;
  });

  return (
    <table id="Labelsets" className="table table-striped">
    <thead>
      <tr>
        <th>Name</th>
        <th>Label Type</th>
        <th>Label Count</th>
        <th>Dataset</th>
        <th>Last Updated</th>
        <th>Origin</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
    {labelsets.map(function(labelset) {
      return (
        <tr key={"labelset-" + (labelset._id != undefined ? labelset._id : "")}>
          <td>
            <Link href={"/viewdataset?" + new URLSearchParams({
              dataset_id:labelset['dataset_id'],
              labelset_id:labelset['_id']
            })}>{ labelset.name } </Link>
          </td>
          <td>
            { formatAnalyserType(labelset.label_type) } 
          </td>
          <td>
            { labelset.label_count } 
          </td>
          <td>
            { labelset.dataset_name } 
          </td>
          <td>
            { 'last_updated' in labelset ? (new Date(labelset['last_updated']).toLocaleString()) : (("_id" in labelset) ? dateFromObjectId(labelset._id).toLocaleString() : "") }
          </td>
          <td>
          { (labelset['owner'] == user.sub) && ("origin" in labelset) && (labelset.origin != "system") ? (
            user.nickname
          ) : (
            ("origin" in labelset) && (labelset.origin == "user") ? (<>Shared</>) : (<>System</>)
          )}
          </td>
          <td>
          { labelset['owner'] == user.sub ? (
              <ButtonModal 
                onPressHandler={onDeleteHandler} 
                id={labelset._id} 
                title={"Delete Labelset"}
                iconName="delete"
                warningText="Note: Any analysers that use this labelset may become unusable."
                buttonActionText="Delete"
              >{"Are you sure you want to permanently delete" + (labelset.name.length>0 ? (" labelset '" + labelset.name + "' ") : " this labelset") + "?"}</ButtonModal>
          ) : (
            <></>
          )}
          </td>
        </tr>
      )
    })}
      <tr>
        
      </tr>
    </tbody>
    </table>
  );
}

export default LabelsetList;