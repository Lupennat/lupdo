import { ATTR_DEBUG, DEBUG_ENABLED } from '../../src/constants';
import Pdo from '../../src/pdo';
import PdoConnection from '../../src/support/pdo-connection';

describe('Pdo Pool', () => {
  it('Works Connection Pool Events Parameters', async () => {
    const createdMock = jest.fn();
    const acquiredMock = jest.fn();
    const destroyedMock = jest.fn();
    const releasedMock = jest.fn();

    const pdo = new Pdo(
      'fake',
      {},
      {
        min: 1,
        max: 1,
        created: createdMock,
        destroyed: destroyedMock,
        acquired: acquiredMock,
        released: releasedMock,
      },
    );

    await pdo.query('SELECT 1');
    expect(typeof createdMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(createdMock.mock.lastCall[1]).toBeInstanceOf(PdoConnection);
    expect(createdMock).toBeCalledTimes(1);

    expect(typeof acquiredMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(acquiredMock).toBeCalledTimes(1);
    expect(typeof releasedMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(releasedMock).toBeCalledTimes(1);

    expect(destroyedMock).toBeCalledTimes(0);

    await pdo.query('SELECT 1');
    expect(createdMock).toBeCalledTimes(1);

    expect(typeof acquiredMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(acquiredMock).toBeCalledTimes(2);
    expect(typeof releasedMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(releasedMock).toBeCalledTimes(2);

    expect(destroyedMock).toBeCalledTimes(0);

    await pdo.disconnect();

    expect(typeof destroyedMock.mock.lastCall[0] === 'string').toBeTruthy();
    expect(destroyedMock).toBeCalledTimes(1);
  });

  it('Works Connection Pool Events', async () => {
    const events: {
      created: {
        [key: string]: number;
      };

      destroyed: {
        [key: string]: number;
      };

      acquired: {
        [key: string]: number;
      };

      released: {
        [key: string]: number;
      };
    } = {
      created: {},
      destroyed: {},
      acquired: {},
      released: {},
    };

    const pdo = new Pdo(
      'fake',
      {},
      {
        max: 5,
        async created(uuid: string): Promise<void> {
          events.created[uuid] =
            events.created[uuid] == null ? 1 : events.created[uuid] + 1;
        },
        async destroyed(uuid: string): Promise<void> {
          events.destroyed[uuid] =
            events.destroyed[uuid] == null ? 1 : events.destroyed[uuid] + 1;
        },
        acquired(uuid: string): void {
          events.acquired[uuid] =
            events.acquired[uuid] == null ? 1 : events.acquired[uuid] + 1;
        },
        released(uuid: string): void {
          events.released[uuid] =
            events.released[uuid] == null ? 1 : events.released[uuid] + 1;
        },
      },
    );

    expect(Object.keys(events.created).length).toBe(0);
    expect(Object.keys(events.destroyed).length).toBe(0);
    expect(Object.keys(events.acquired).length).toBe(0);
    expect(Object.keys(events.released).length).toBe(0);

    const promises = Promise.all([
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
      pdo.query('SELECT 1'),
    ]);
    await promises;
    expect(Object.keys(events.created).length).toBeLessThanOrEqual(5);
    expect(Math.max(...Object.values(events.created))).toBe(1);
    expect(Object.keys(events.destroyed).length).toBe(0);
    expect(Object.keys(events.acquired).length).toBeLessThanOrEqual(5);
    expect(
      Object.values(events.acquired).reduce(
        (partialSum, a) => partialSum + a,
        0,
      ),
    ).toBe(13);
    expect(Math.max(...Object.values(events.acquired))).toBeGreaterThanOrEqual(
      1,
    );
    expect(Object.keys(events.released).length).toBe(5);
    expect(
      Object.values(events.released).reduce(
        (partialSum, a) => partialSum + a,
        0,
      ),
    ).toBe(13);
    expect(Math.max(...Object.values(events.released))).toBeGreaterThanOrEqual(
      1,
    );
    await pdo.disconnect();
    expect(Object.keys(events.destroyed).length).toBe(
      Object.keys(events.created).length,
    );
    expect(Math.max(...Object.values(events.destroyed))).toBe(1);
  });

  it('Works Connection Pool Kill', async () => {
    console.log = jest.fn();
    console.trace = jest.fn();

    const events: {
      killed: {
        [key: string]: number;
      };
    } = {
      killed: {},
    };

    const pdo = new Pdo(
      'fake',
      {},
      {
        killTimeoutMillis: 500,
        killResource: true,
        max: 1,
        min: 1,
        acquired: () => {
          setTimeout(async () => {
            await pdo.disconnect();
          }, 1000);
        },
        killed(uuid: string): void {
          events.killed[uuid] =
            events.killed[uuid] == null ? 1 : events.killed[uuid] + 1;
        },
      },
      { [ATTR_DEBUG]: DEBUG_ENABLED },
    );

    await expect(pdo.query(`SELECT SLEEP(60);`)).rejects.toThrow(
      'Query execution was interrupted',
    );

    expect(console.log).toHaveBeenCalled();
  });

  it('Works Query Will Be Rejected If resolved When Connection Killed', async () => {
    console.log = jest.fn();
    console.trace = jest.fn();

    const events: {
      killed: {
        [key: string]: number;
      };
    } = {
      killed: {},
    };

    const pdo = new Pdo(
      'fake',
      {},
      {
        killTimeoutMillis: 500,
        killResource: true,
        max: 1,
        min: 1,
        acquired: () => {
          setTimeout(async () => {
            await pdo.disconnect();
          }, 1000);
        },
        killed(uuid: string): void {
          events.killed[uuid] =
            events.killed[uuid] == null ? 1 : events.killed[uuid] + 1;
        },
      },
      { [ATTR_DEBUG]: DEBUG_ENABLED },
    );

    await expect(pdo.query(`SELECT SLEEPRESOLVE(60);`)).rejects.toThrow(
      'Data are compromised',
    );

    expect(console.log).toHaveBeenCalled();
  });

  it('Works Execute Will Be Rejected If resolved When Killed', async () => {
    console.log = jest.fn();
    console.trace = jest.fn();

    const events: {
      killed: {
        [key: string]: number;
      };
    } = {
      killed: {},
    };

    const pdo = new Pdo(
      'fake',
      {},
      {
        killTimeoutMillis: 500,
        killResource: true,
        max: 1,
        min: 1,
        acquired: () => {
          setTimeout(async () => {
            await pdo.disconnect();
          }, 1000);
        },
        killed(uuid: string): void {
          events.killed[uuid] =
            events.killed[uuid] == null ? 1 : events.killed[uuid] + 1;
        },
      },
      { [ATTR_DEBUG]: DEBUG_ENABLED },
    );

    const stmt = await pdo.prepare(`SELECT SLEEPRESOLVE(60);`);

    await expect(stmt.execute()).rejects.toThrow('Data are compromised');

    expect(console.log).toHaveBeenCalled();
  });

  it('Works Exec Will Be Rejected If resolved When Killed', async () => {
    console.log = jest.fn();
    console.trace = jest.fn();

    const events: {
      killed: {
        [key: string]: number;
      };
    } = {
      killed: {},
    };

    const pdo = new Pdo(
      'fake',
      {},
      {
        killTimeoutMillis: 500,
        killResource: true,
        max: 1,
        min: 1,
        acquired: () => {
          setTimeout(async () => {
            await pdo.disconnect();
          }, 1000);
        },
        killed(uuid: string): void {
          events.killed[uuid] =
            events.killed[uuid] == null ? 1 : events.killed[uuid] + 1;
        },
      },
      { [ATTR_DEBUG]: DEBUG_ENABLED },
    );

    await expect(
      pdo.exec(
        'INSERT INTO `users` (`name`, `gender`) VALUES ("SleepResolve", "All");',
      ),
    ).rejects.toThrow('Data are compromised');

    expect(console.log).toHaveBeenCalled();
  });
});
