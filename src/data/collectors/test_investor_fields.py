"""KIS API 투자자 응답 필드 확인용 테스트 (사용 후 삭제 가능)"""
from kis_api import kis_get

data = kis_get('/uapi/domestic-stock/v1/quotations/inquire-investor', 'FHKST01010900', {
    'FID_COND_MRKT_DIV_CODE': 'J',
    'FID_INPUT_ISCD': '005930',
})

if data and data.get('output') and len(data['output']) > 1:
    item = data['output'][1]
    print(f'=== 삼성전자 {item["stck_bsop_date"]} 투자자 데이터 ===')
    print(f'  종가: {item["stck_clpr"]}')
    print(f'  --- 순매수 수량 ---')
    print(f'  기관: {item["orgn_ntby_qty"]}')
    print(f'  외국인: {item["frgn_ntby_qty"]}')
    print(f'  개인: {item["prsn_ntby_qty"]}')
    print(f'  --- 순매수 금액 ---')
    print(f'  기관: {item["orgn_ntby_tr_pbmn"]}')
    print(f'  외국인: {item["frgn_ntby_tr_pbmn"]}')
    print(f'  개인: {item["prsn_ntby_tr_pbmn"]}')
else:
    print('데이터 부족')
