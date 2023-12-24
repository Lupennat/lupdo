export default {
    users: {
        columns: ['id', 'name', 'gender'],
        data: [
            { id: 1, name: 'Edmund', gender: 'Multigender' },
            { id: 2, name: 'Kyleigh', gender: 'Cis man' },
            { id: 3, name: 'Josefa', gender: 'Cisgender male' },
            { id: 4, name: 'Cecile', gender: 'Agender' },
            { id: 5, name: 'Sincere', gender: 'Demi-girl' },
            { id: 6, name: 'Baron', gender: 'Cisgender male' },
            { id: 7, name: 'Mckayla', gender: 'Genderflux' },
            { id: 8, name: 'Wellington', gender: 'Cisgender woman' },
            { id: 9, name: 'Tod', gender: 'Demi-man' },
            { id: 10, name: 'Jeffrey', gender: 'Androgyne' },
            { id: 11, name: 'Keenan', gender: 'Two-spirit person' },
            { id: 12, name: 'Lucile', gender: 'Man' },
            { id: 13, name: 'Kyra', gender: 'Other' },
            { id: 14, name: 'Jermain', gender: 'Gender neutral' },
            { id: 15, name: 'Kelli', gender: 'Agender' },
            { id: 16, name: 'Jeffry', gender: 'Two-spirit person' },
            { id: 17, name: 'Dawn', gender: 'Male to female' },
            { id: 18, name: 'Ofelia', gender: 'Cis female' },
            { id: 19, name: 'Icie', gender: 'F2M' },
            { id: 20, name: 'Matilde', gender: 'Trans' },
            { id: 21, name: 'Marcelina', gender: 'Transgender female' },
            { id: 22, name: 'Destin', gender: 'Male to female transsexual woman' },
            { id: 23, name: 'Reilly', gender: 'Intersex man' },
            { id: 24, name: 'Casimer', gender: 'Other' },
            { id: 25, name: 'Carli', gender: 'Bigender' },
            { id: 26, name: 'Harry', gender: 'Cis man' },
            { id: 27, name: 'Ellie', gender: 'Omnigender' },
            { id: 28, name: 'Solon', gender: 'Gender neutral' },
            { id: 29, name: 'Lesley', gender: 'Cis' },
            { id: 30, name: 'Nikolas', gender: 'Agender' }
        ]
    },
    companies: {
        columns: ['id', 'name', 'opened', 'active', 'binary'],
        data: [
            { id: 1, name: 'Satterfield Inc', opened: '2022-10-22T00:00:00.000Z', active: 1, binary: null },
            { id: 2, name: 'Grimes - Reinger', opened: '2022-11-22T00:00:00.000Z', active: 0, binary: null },
            { id: 3, name: 'Skiles LLC', opened: '2022-12-12T00:00:00.000Z', active: 0, binary: null },
            { id: 4, name: 'White, Hermiston and Kihn', opened: '2020-10-01T00:00:00.000Z', active: 1, binary: null },
            { id: 5, name: 'Huel LLC', opened: '2018-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 6, name: 'Aufderhar - Schroeder', opened: '2019-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 7, name: 'Powlowski - VonRueden', opened: '2014-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 8, name: 'Murray - Hagenes', opened: '2015-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 9, name: 'Bednar LLC', opened: '2013-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 10, name: 'Kirlin - Bednar', opened: '2011-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 11, name: 'Kassulke - Auer', opened: '2010-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 12, name: 'Orn - Pouros', opened: '2021-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 13, name: 'Greenfelder - Paucek', opened: '2009-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 14, name: 'Hand, Effertz and Shields', opened: '2000-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 15, name: 'Harber - Heidenreich', opened: '2001-12-22T00:00:00.000Z', active: 0, binary: null },
            { id: 16, name: 'Greenholt - Durgan', opened: '2000-12-22T00:00:00.000Z', active: 1, binary: null },
            { id: 17, name: 'Hauck - Murazik', opened: '2000-12-22T00:00:00.000Z', active: 0, binary: null },
            { id: 18, name: 'Beier and Sons', opened: '1999-12-22T00:00:00.000Z', active: 0, binary: null },
            { id: 19, name: 'Harvey Inc', opened: '2022-12-22T00:00:00.000Z', active: 1, binary: null }
        ]
    },
    procedure: {
        columns: [
            [
                { name: 'id', table: 'companies' },
                { name: 'name', table: 'companies' }
            ],
            [
                { name: 'id', table: 'users' },
                { name: 'name', table: 'users' },
                { name: 'gender', table: 'users' }
            ]
        ],
        data: [
            [
                [1, 'Satterfield Inc'],
                [2, 'Grimes - Reinger'],
                [3, 'Skiles LLC']
            ],
            [
                [1, 'Edmund', 'Multigender'],
                [2, 'Kyleigh', 'Cis man']
            ]
        ]
    }
};
