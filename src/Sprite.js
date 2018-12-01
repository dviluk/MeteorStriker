/** cc.Spriteのラッパクラス
 * @class Sprite
 */
class Sprite{

	constructor(img){
		//座標
		this.x		= 0;
		this.y		= 0;
		this.radius	= 0;
		this.angle	= 0;

		//スプライト本体
		this.currentIndex	= -1;
		this.entity			= new cc.Sprite(`${rc.DIRECTORY}${img[0]}`);

		//リソースデータ
		this.img	= {
			"path"		: img[0],
			"nSplitX"	: img[1] || 1,
			"nSplitY"	: img[2] || 1,
		};
		this.img.width		= this.entity.getContentSize().width;
		this.img.height		= this.entity.getContentSize().height;

		//初期化
		this.setIndex(0);
	}

	/** インスタンス生成
	 * @static
	 * @param {*} img
	 * @returns
	 * @memberof Sprite
	 */
	static CreateInstance(img){
		return new Sprite(img);
	}

	/** インスタンス取得
	 * @returns
	 * @memberof Sprite
	 */
	GetInstance(){
		return this.entity;
	}

	/** 座標設定
	 * @param {number} x x座標。null時は設定しない。
	 * @param {number} y y座標。null時は設定しない。
	 * @param {number} [a=null] 角度。null時は設定しない。
	 * @param {number} [r=null] 半径。null時は設定しない。
	 * @returns this
	 * @memberof Sprite
	 */
	SetPosition(x,y,a=null,r=null){
		this.x		= x!=null	? x	: this.x;
		this.y		= y!=null	? y	: this.y;
		this.angle	= a!=null	? a	: this.angle;
		this.radius	= r!=null	? r	: this.radius;

		if(this.radius==0){
			this.entity.attr({	x:this.x,	y:this.y,	});
		}
		else{
			this.entity.attr({
				x	: this.x + Math.cos(this.angle) *this.radius,
				y	: this.y + Math.sin(this.angle) *this.radius,
			});
		}
		return this;
	}

	/** cc.Sprite.attrのラッパ
	 * @param {*} attr
	 * @returns this
	 * @memberof Sprite
	 */
	Attr(attr){
		if(attr.x!=null || attr.y!=null){
			this.SetPosition(	attr.x!=null?attr.x:null,	attr.y!=null?attr.y:null	);
			delete attr.x;
			delete attr.y;
		}
		this.entity.attr(attr);

		return this;
	}

	/** レイヤに自身を追加
	 * @param {*} layer
	 * @returns this
	 * @memberof Sprite
	 */
	AddToLayer(layer){
		this.entity.removeFromParent();
		layer.addChild(this.entity);
		return this;
	}

	/** イベントリスナを追加
	 * @param {*} listener
	 * @returns this
	 * @memberof Sprite
	 */
	AddEventListener(listener){
		cc.eventManager.addListener(listener,this.entity);
		return this;
	}

	/** マルチ画像スプライトで表示インデックスをセットする
	 * @param {*} idx
	 * @returns this
	 * @memberof Sprite
	 */
	setIndex(idx){
		if(this.currentIndex===idx)	return this;

		if(this.img.width>0 && this.img.height>0 && this.img.nSplitX>0 && this.img.nSplitY>0){
			const x	= parseInt( idx % this.img.nSplitX );
			const y	= parseInt( idx / this.img.nSplitX );
			const w	= parseInt( this.img.width /this.img.nSplitX );
			const h	= parseInt( this.img.height/this.img.nSplitY );

			this.entity.setTextureRect(cc.rect( x*w, y*h, w, h)	);
			this.currentIndex	= idx;
		}
		else{
			this.currentIndex	= 0;
		}
		return this;
	}
}