from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os
root=os.path.join(os.path.dirname(__file__),'..','assets')
font='/usr/share/fonts/truetype/nanum/NanumSquareB.ttf'
fontregular='/usr/share/fonts/truetype/nanum/NanumSquareR.ttf'
latin='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def f(size,bold=True):return ImageFont.truetype(font if bold else fontregular,size)
def draw_icon(size):
 s=4;side=size*s
 im=Image.new('RGBA',(side,side),'#0f3023'); d=ImageDraw.Draw(im)
 d.rounded_rectangle((0,0,side-1,side-1),radius=round(side*.22),fill='#0f3023')
 # nested detection arcs
 box=(side*.16,side*.15,side*.84,side*.83)
 d.arc(box,181,359,fill='#9dfcc6',width=round(side*.06))
 box2=(side*.32,side*.32,side*.68,side*.68)
 d.arc(box2,181,359,fill='#9dfcc6',width=round(side*.055))
 d.line((side*.52,side*.55,side*.77,side*.80),fill='#9dfcc6',width=round(side*.052))
 r=side*.10
 d.ellipse((side*.50-r,side*.56-r,side*.50+r,side*.56+r),fill='#cbffdb')
 return im.resize((size,size),Image.Resampling.LANCZOS).convert('RGB')
for size,name in [(16,'favicon-16.png'),(32,'favicon-32.png'),(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:draw_icon(size).save(os.path.join(root,name))
# Main social preview, 1200x630
W,H=1200,630
im=Image.new('RGB',(W,H));px=im.load()
for y in range(H):
 for x in range(W):
  t=x/W
  glow=max(0,1-math.hypot((x-940)/520,(y-230)/430))
  px[x,y]=(int(11+10*t+12*glow),int(35+20*t+37*glow),int(27+12*t+25*glow))
d=ImageDraw.Draw(im)
# vertical decorative lines
for x in range(0,W,100):d.line((x,0,x,H),fill=(29,70,49),width=1)
for y in range(0,H,100):d.line((0,y,W,y),fill=(29,70,49),width=1)
# logo
d.rounded_rectangle((73,70,137,134),radius=17,fill='#153e2f')
d.arc((84,82,126,124),181,359,fill='#89f5b6',width=4)
d.arc((95,93,115,113),181,359,fill='#89f5b6',width=3)
d.ellipse((102,105,110,113),fill='#a9ffd2')
d.line((107,109,123,123),fill='#a9ffd2',width=4)
d.text((151,81),'맥딜 레이더',font=f(32),fill='#e6fff0')
d.text((75,185),'맥북 특가,',font=f(68),fill='#f9fff9')
d.text((75,270),'흩어져 있지 않게.',font=f(67),fill='#90f4b7')
d.text((77,382),'판매처별 공개 할인 · 카드·쿠폰 조건 · 원문 링크',font=f(27,False),fill='#bfd8c7')
d.rounded_rectangle((75,472,362,530),radius=13,fill='#89f1b1')
d.text((102,489),'GitHub 무료 특가 피드  ↗',font=f(22),fill='#102f21')
d.text((76,563),'MAC DEAL INTELLIGENCE   •   KOREA',font=ImageFont.truetype(latin,16),fill='#7fa58c')
# radar rings
cx,cy=908,310
for r,alpha in [(246,45),(187,73),(120,88),(53,115)]:
 c=(57+alpha//4,127+alpha//5,89+alpha//4)
 d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=c,width=2)
d.line((cx-246,cy,cx+246,cy),fill=(43,107,73),width=2)
d.line((cx,cy-245,cx,cy+245),fill=(43,107,73),width=2)
d.pieslice((cx-245,cy-245,cx+245,cy+245),-56,0,fill=(24,91,60))
for x,y in [(cx+143,cy-75),(cx-108,cy+141),(cx-133,cy-102)]:
 d.ellipse((x-8,y-8,x+8,y+8),fill='#9ffec3')
 d.ellipse((x-16,y-16,x+16,y+16),outline='#64c992',width=2)
d.ellipse((cx-16,cy-16,cx+16,cy+16),fill='#b7ffd7')
d.rounded_rectangle((822,63,1106,124),radius=13,fill='#23553b')
d.ellipse((842,88,852,98),fill='#98ffc5')
d.text((866,80),'공개 행사 탐지',font=f(23),fill='#e5fff0')
im.save(os.path.join(root,'og-preview.png'),optimize=True)
# repository preview crop (1280 x 640; expand horizontally)
repo=Image.new('RGB',(1280,640),'#0e2e20'); repo.paste(im,(40,5));repo.save(os.path.join(root,'repository-preview.png'),optimize=True)
print('Generated images:',[(n,os.stat(os.path.join(root,n)).st_size) for n in os.listdir(root) if n.endswith('.png')])
