var express = require('express');

// For Upload Image //
var multer = require('multer');
var path = require('path');

// For Stateless Authentication Login/Logout //

var jwt = require('jsonwebtoken');
if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

var empModel=require('../modules/employee');
var uploadModel=require('../modules/upload');

var router = express.Router();

var employee=empModel.find({});
var imageData=uploadModel.find({});


router.use(express.static(__dirname+"./public/"));

// For Upload Image //
var Storage= multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
  }
});

// For Upload Image using middleware //
var upload = multer({
  storage:Storage
}).single('file');

// For image save and display in browser //
/* GET home page. */
router.post('/upload', upload ,function(req, res, next) {
  var imagefile = req.file.filename;
  var success =req.file.filename+ "Uploaded Successfully";

  var imageDetails = new uploadModel({
      imagename: imagefile
  });
  imageDetails.save(function(err,doc){
    if(err) throw err;
    imageData.exec(function(err,data){
        if(err) throw err;
        res.render('uplode-file', { title: 'Upload File' ,records:data,success:success });
    });
  });
 
});

// For Stateless Authentication Login/Logout //
function checkLogin(req,res,next){
  var myToken=localStorage.getItem('myToken');
  try {
    jwt.verify(myToken, 'loginToken');
  } catch(err) {
    res.send("You need login to access this page");
  }
  next();
}

// open uplode-file.ejs //
router.get('/upload', function(req, res, next) {
  imageData.exec(function(err,data){
    if(err) throw err;
    res.render('uplode-file', { title: 'Upload File' ,records:data,success:'' });
  });
});
  
// open index.ejs //
router.get('/', checkLogin,function(req, res, next) {
  employee.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee Records', records: data,success:'' });
  });
  
});

router.get('/login', function(req, res, next) {
  var token = jwt.sign({ foo: 'bar' }, 'loginToken');
  localStorage.setItem('myToken', token)
  res.send("Login Successfully");
});

router.get('/logout', function(req, res, next) {
  localStorage.removeItem('myToken')
  res.send("Logout Successfully");
});

// For Employeedata save and display in browser //
router.post("/",upload,function(req,res,next){
  var empDetails = new empModel({
      name: req.body.uname,
      email: req.body.email,
      etype: req.body.emptype,
      hourlyrate: parseInt(req.body.hrlyrate),
      totalHour: parseInt(req.body.ttlhr),
      total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
      image:req.file.filename,
  });

    empDetails.save(function(err,res1){
      if(err) throw err;
      employee.exec(function(err,data){
        if(err) throw err;
        res.render('index', { title: 'Employee Records', records: data, success:'Record Inserted Successfully' });
        });
    });

    
});

// filter employee data and display//
router.post("/search/",function(req,res,next){

  var flrtName = req.body.fltrname;
  var flrtEmail = req.body.fltremail;
  var fltremptype = req.body.fltremptype;

  if(flrtName !='' && flrtEmail !='' && fltremptype !='' ){
    var fltrParameter={ $and:[{ name: flrtName},
      {$and:[{email: flrtEmail},{etype: fltremptype}]}
    ]
    }
  }else if(flrtName !='' && flrtEmail =='' && fltremptype !=''){
    var fltrParameter={ $and:[{ name: flrtName},{etype: fltremptype}]
    }
  }else if(flrtName =='' && flrtEmail !='' && fltremptype !=''){
    var fltrParameter={ $and:[{ email: flrtEmail},{etype: fltremptype}]
    }
  }else if(flrtName =='' && flrtEmail =='' && fltremptype !=''){
    var fltrParameter={etype: fltremptype
    }
  }else{
    var fltrParameter={}
  }
  var employeeFilter=empModel.find(fltrParameter);
  employeeFilter.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee Records', records: data,success:'' });
  });

});

// delete employee data //
router.get('/delete/:id', function(req, res, next) {

  var id=req.params.id;
  var del = empModel.findByIdAndDelete(id);

  del.exec(function(err){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records: data, success:'Record Deleted Successfully' });
      });
  });
  
});

// open edit.ejs file //
router.get('/edit/:id', function(req, res, next) {

  var id=req.params.id;
  var edit = empModel.findById(id);

  edit.exec(function(err,data){
    if(err) throw err;
    res.render('edit', { title: 'Edit Employee Records', records: data });
  });
  
});

// update employee data and display //
router.post('/update/',upload, function(req, res, next) {
  if(req.file){
      var dataRecords = {
        name: req.body.uname,
        email: req.body.email,
        etype: req.body.emptype,
        hourlyrate: parseInt(req.body.hrlyrate),
        totalHour: parseInt(req.body.ttlhr),
        total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
        image: req.file.filename,
    }
  }else{
    var dataRecords = {
      name: req.body.uname,
      email: req.body.email,
      etype: req.body.emptype,
      hourlyrate: parseInt(req.body.hrlyrate),
      totalHour: parseInt(req.body.ttlhr),
      total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
    }
  }
  var update = empModel.findByIdAndUpdate(req.body.id,dataRecords);

  update.exec(function(err,data){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.redirect("/");
      });
  });
  
});

router.get('/autocomplete/', function(req, res, next) {

  var regex= new RegExp(req.query["term"],'i');
 
  var employeeFilter =empModel.find({name:regex},{'name':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);
  employeeFilter.exec(function(err,data){


var result=[];
if(!err){
   if(data && data.length && data.length>0){
     data.forEach(user=>{
       let obj={
         id:user._id,
         label: user.name
       };
       result.push(obj);
     });

   }
 
   res.jsonp(result);
}

  });

});

module.exports = router;
