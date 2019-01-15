var Label;

(function(){	//File Scope

/** cc.LabelXXXのラッパクラス
 * @class Label
 */
Label	= class Label{

	constructor(text,fontName,fontSize){
		/** @const Z座標 */
		this.Z	= 65535;

		this.entity	= cc.LabelTTF.create(text,fontName,fontSize);
		this.entity.attr({zIndex:this.Z});

		//背景
		this.bg	= new LabelBg(this);
	}

	/** インスタンス生成
	 * @static
	 * @returns
	 * @memberof Labe;
	 */
	static CreateInstance(fontSize=16,fontName="Arial"){
		return new Label("",fontName,fontSize);
	}

	/** インスタンス取得
	 * @returns cc.LabelAtlas
	 * @memberof Label
	 */
	GetInstance(){
		return this.entity;
	}

	/** 可視設定
	 * @param {boolean} visible
	 * @returns {this}
	 * @memberof Label
	 */
	SetVisible(visible){
		this.entity.setVisible(!!visible);
		return this;
	}

	/** 更新 */
	Update(dt){
		if(this.bg.IsEnabled()){
		}
		return this;
	}

	/** ラベルのサイズを取得
	 * @returns {this}
	 * @memberof Label
	 */
	GetContentSize(){
		return this.entity.getContentSize();
	}

	/** レイヤに自身を追加
	 * @param {Number} idx
	 * @param {*} layer
	 * @returns this
	 * @memberof Label
	 */
	AddToLayer(layer){
		this.entity.removeFromParent();
		layer.addChild(this.entity);
		if(this.bg.IsEnabled())	this.bg.ApplicateLayer();
		return this;
	}

	/** 座標設定
	 * @param {numver} x
	 * @param {number} y
	 * @returns
	 * @memberof Label
	 */
	SetPosition(x,y){
		this.entity.setPosition(x,y);
		if(this.bg.IsEnabled())	this.bg.ApplicatePosition();

		return this;
	}

	/** 背景の有効化/無効化
	 * @param {boolean} isEnabled
	 * @returns {this}
	 * @memberof Label
	 */
	SetBgEnabled(isEnabled){
		this.bg.SetEnabled(isEnabled);
		return this;
	}

	/** テキスト設定
	 * @param {string} text
	 * @returns
	 * @memberof Label
	 */
	SetString(text){
		this.entity.setString(text);
		if(this.bg.IsEnabled())	this.bg.ApplicateSize();
		return this;
	}

	/** カラー設定
	 * @param {strinf|cc.color} color
	 * @returns
	 * @memberof Label
	 */
	SetColor(color){
		this.entity.setColor( typeof color==='string'?cc.color(color):color );
		return this;
	}

};


//ラベル背景
class LabelBg{

	constructor(parent){
		/** @var 紐付いているLabel */
		this.parent		= parent;
		/** @const 描画するZ座標*/
		this.Z			= this.parent.Z - 1;
		/** @const 不透明度 */
		this.OPACITY	= 128;
		/** @const 背景色 */
		this.COLOR		= new cc.color(0,0,0);
		/** @const パディング  */
		this.PADDING	= { horizon:4,	vertical:2	};

		/** @var cc.DwarNodeクラスのインスタンス */
		this.entity	= null;
		/** @var サイズ上限*/
		this.upper	= {width:null,	height:null,};
		/** @var サイズ下限*/
		this.lower	= {width:0,		height:0,	};

		this.imgWidth	= 128;
		this.imgHeight	= 128;

	}

	/** 背景インスタンスの生成
	 * @returns {this}
	 * @memberof LabelBg
	 */
	Create(){
		if(this.entity)	this.entity.clear();

		this.entity		= new cc.Sprite(`${rc.DIRECTORY}${rc.sysImg.labelBg}`);
		this.imgWidth	= this.entity.getContentSize().width;
		this.imgHeight	= this.entity.getContentSize().height;
		this.entity.setColor(this.COLOR);
		this.entity.attr({zIndex:this.Z, opacity:this.OPACITY, });

		let size	= this.parent.GetContentSize();
		this.SetSize(size.width,size.height);
		this.ApplicateLayer();
		return this;
	}

	/** 背景を有効化/無効化する
	 * @param {*} isEnabled
	 * @returns
	 * @memberof LabelBg
	 */
	SetEnabled(isEnabled){
		if(!isEnabled){
			this.entity	= null;
			return this;
		}

		if(this.entity == null)	this.Create();
		return this;
	}

	/** 背景が有効なら真
	 * @returns boolean
	 * @memberof LabelBg
	 */
	IsEnabled(){
		return this.entity!=null;
	}

	/** 背景サイズ設定
	 * @param {number} [width=0]
	 * @param {number} [height=0]
	 * @returns
	 * @memberof LabelBg
	 */
	SetSize(width=0,height=0){
		width	= Clamp(width +this.PADDING.horizon*2, this.lower.width, this.upper.width);
		height	= Clamp(height+this.PADDING.vertical*2,this.lower.height,this.upper.height);

		this.entity.setScale(width/this.imgWidth,height/this.imgHeight);
		this.ApplicatePosition();
		return this;
	}

	ApplicateSize(){
		let size	= this.parent.GetContentSize();
		this.SetSize(size.width,size.height);
		return this;
	}
	/** 背景座標を更新
	 * @returns
	 * @memberof LabelBg
	 */
	ApplicatePosition(){
		let pos	= this.parent.entity.getPosition();
		this.entity.setPosition(pos.x,pos.y+3);
		return this;
	}

	/** 背景の描画レイヤを更新
	 * @returns
	 * @memberof LabelBg
	 */
	ApplicateLayer(){
		let layer	= this.parent.entity.getParent();
		if(this.entity && layer){
			this.entity.removeFromParent();
			layer.addChild(this.entity);
		}
		return this;
	}
}


})();	//File Scope
