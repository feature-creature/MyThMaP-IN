// -------------------------------------------------------------------
class Environment {
  constructor( env, dos, as ){    
    this.subareas = env.subareas;
    this.offices = dos;
    this.agencies = this.setupAgencies(as);
  }
  
  
  draw(){
    background( 245 );
    this.drawBorder();
    this.drawSubarea( this.subareas )
    this.drawProtoarea( this.agencies, color("#8c4e95") );
    this.drawProtoarea( this.offices, color("#3f4d84") );
  }

    
  setupAgencies(as){
    let a = {};    
    for( const [k, v] of Object.entries( as ) ) a[k] = new Agency( k, v.subarea, v.loc );
    return a;
  }
  
  
  drawSubarea(s){
    push();
    textAlign( LEFT, BOTTOM );
    beginShape( QUADS );  
    for( const [k, v] of Object.entries( s ) ){
      noStroke();
      if( v.area == "border" ){
        fill( 255 );
        textSize(13);
        text(k, v.boundaries[0].x +10, v.boundaries[0].y - 4);
      }else{
        textSize(20);
        fill( 50 );
        text(k, v.boundaries[0].x, v.boundaries[0].y - 10 );
      }
      if( v.area == "border" ){
        stroke(0)
      }else{
        stroke(200)
      }
      fill( 250 );
      vertex( v.boundaries[0].x, v.boundaries[0].y );
      vertex( v.boundaries[1].x, v.boundaries[0].y );
      vertex( v.boundaries[1].x, v.boundaries[1].y );
      vertex( v.boundaries[0].x, v.boundaries[1].y );
    }
    endShape();
    pop();
  }
  
  
  drawProtoarea(s, c){
    push();  
    rectMode( CENTER );
    textAlign( CENTER, CENTER );
    for( const [k, v] of Object.entries( s ) ){
      push();
      translate( v.loc.x, v.loc.y );
      fill( c );
      rect( 0, 0, 25 );
      fill( 225 );
      text( k, 0, 0 );
      pop(); 
    }
    pop();
  }
  
    
  drawBorder(){
    push();
    stroke( 0,50,235,150 );
    stroke( 0 );
    strokeWeight(28);
    line( width*0.5, 0, width*0.5, height+5 );
    pop();
  }
  
}
