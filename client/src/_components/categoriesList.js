'use client'
 
import { useState, useEffect } from 'react'
import LoaderButton from './loaderButton';
import DeleteModal from './buttonModal';
 
const CategoryList = ({
  user,
  categories=[{id:"Loading...",name:" "}], 
  onDeleteHandler=()=>{}
}) => {

  console.log(categories)

  return (
    <table id="Categories" className="table table-striped">
    <thead>
      <tr>
        <th>Name</th>
        <th>Origin</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
    {categories.map(function(category) {
      return (
        <tr key={"category-" + (category._id != undefined ? category._id : "")}>
          <td>
            { category.name } 
          </td>
          <td>
          { category.owner == user.sub ? (
            user.nickname
          ) : (
            <>Default</>
          )}
          </td>
          <td>
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

export default CategoryList;