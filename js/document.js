// -------------------------------------------------------------------
class Document{
  constructor( d, e = null ){  
    this.type = d.type;
    this.expiration = d.expiration;
    this.activation = frameCount;
    this.cost = bahtToFloat(d.cost);
    this.employer = e;
  }
  
  isExpired(){ return frameCount - this.activation > this.expiration; }
}